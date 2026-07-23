import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getServerSession } from 'next-auth/next';
import { ObjectId } from 'mongodb';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';

const ALLOWED_LOCATION_TYPES = new Set(['warehouse', 'camp/office', 'project_site', 'department']);

type HeaderMap = Record<string, string>;

const HEADER_MAPPING: HeaderMap = {
  assetnumber: 'assetnumber',
  'asset number': 'assetnumber',
  employeenumber: 'employeenumber',
  'employee number': 'employeenumber',
  employeename: 'employeename',
  'employee name': 'employeename',
  locationtype: 'locationType',
  'location type': 'locationType',
  custodycity: 'custodyCity',
  'custody city': 'custodyCity',
  premisesid: 'premisesId',
  'premises id': 'premisesId',
  premiseslabel: 'premisesLabel',
  'premises label': 'premisesLabel',
  floorroom: 'floorRoom',
  'floor room': 'floorRoom',
  occupant: 'occupant',
  custodyremark: 'custodyRemark',
  'custody remark': 'custodyRemark',
  rackbinpallet: 'rackBinPallet',
  'rack bin pallet': 'rackBinPallet',
  shedroomnumber: 'shedRoomNumber',
  'shed room number': 'shedRoomNumber',
  custodiandetail: 'custodianDetail',
  'custodian detail': 'custodianDetail',
  containernumberrack: 'containerNumberRack',
  'container number rack': 'containerNumberRack',
  warehousecity: 'warehouseCity',
  'warehouse city': 'warehouseCity',
  warehouselocation: 'warehouseLocation',
  'warehouse location': 'warehouseLocation',
  departmentlocation: 'departmentLocation',
  'department location': 'departmentLocation',
  campofficelocation: 'campOfficeLocation',
  'camp office location': 'campOfficeLocation',
  location: 'location',
  project: 'project',
  projectname: 'projectname',
  'project name': 'projectname',
  custodyfrom: 'custodyfrom',
  'custody from': 'custodyfrom',
  custodyto: 'custodyto',
  'custody to': 'custodyto',
  documentnumber: 'documentnumber',
  'document number': 'documentnumber',
};

const OPTIONAL_STRING_FIELDS = [
  'custodyCity',
  'premisesId',
  'premisesLabel',
  'floorRoom',
  'occupant',
  'custodyRemark',
  'rackBinPallet',
  'shedRoomNumber',
  'custodianDetail',
  'containerNumberRack',
  'warehouseCity',
  'warehouseLocation',
  'departmentLocation',
  'campOfficeLocation',
  'location',
  'project',
  'projectname',
  'documentnumber',
] as const;

function normalizeHeader(header: unknown): string {
  return String(header ?? '')
    .trim()
    .replace(/\*/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function toOptionalString(value: unknown): string | null {
  const cleaned = String(value ?? '').trim();
  return cleaned === '' ? null : cleaned;
}

function toRequiredString(value: unknown): string {
  return String(value ?? '').trim();
}

function parseDateValue(value: unknown, field: string, rowLabel: string): Date | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${rowLabel}: ${field} must be a valid date`);
  }
  return parsed;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const createdBy = session.user.name || session.user.email;
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(Buffer.from(arrayBuffer), { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: false,
    });

    const nonEmptyRows = rows.filter((row) =>
      Array.isArray(row) && row.some((cell) => String(cell ?? '').trim() !== '')
    );

    if (nonEmptyRows.length < 2) {
      return NextResponse.json(
        { error: 'File must contain at least one header row and one data row' },
        { status: 400 }
      );
    }

    const normalizedHeaders = nonEmptyRows[0].map(normalizeHeader);
    const columnToField = normalizedHeaders.map((h) => HEADER_MAPPING[h] ?? '');

    const requiredFields = ['assetnumber', 'employeenumber', 'employeename', 'locationType', 'custodyfrom'];
    const missingRequiredHeaders = requiredFields.filter((requiredField) => !columnToField.includes(requiredField));
    if (missingRequiredHeaders.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required header(s): ${missingRequiredHeaders.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const docsToInsert: Record<string, unknown>[] = [];
    const errors: string[] = [];

    for (let rowIndex = 1; rowIndex < nonEmptyRows.length; rowIndex++) {
      const row = nonEmptyRows[rowIndex];
      const rowLabel = `Row ${rowIndex + 1}`;
      const mapped: Record<string, unknown> = {};

      columnToField.forEach((field, columnIndex) => {
        if (!field) return;
        mapped[field] = row[columnIndex];
      });

      try {
        const assetnumber = toRequiredString(mapped.assetnumber);
        const employeenumber = toRequiredString(mapped.employeenumber);
        const employeename = toRequiredString(mapped.employeename);
        const locationType = toRequiredString(mapped.locationType);
        const custodyfrom = parseDateValue(mapped.custodyfrom, 'custodyfrom', rowLabel);
        const custodyto = parseDateValue(mapped.custodyto, 'custodyto', rowLabel);

        if (!assetnumber) throw new Error(`${rowLabel}: assetnumber is required`);
        if (!employeenumber) throw new Error(`${rowLabel}: employeenumber is required`);
        if (!employeename) throw new Error(`${rowLabel}: employeename is required`);
        if (!locationType) throw new Error(`${rowLabel}: locationType is required`);
        if (!custodyfrom) throw new Error(`${rowLabel}: custodyfrom is required`);

        if (!ALLOWED_LOCATION_TYPES.has(locationType)) {
          throw new Error(
            `${rowLabel}: locationType must be one of ${Array.from(ALLOWED_LOCATION_TYPES).join(', ')}`
          );
        }

        const doc: Record<string, unknown> = {
          assetnumber,
          employeenumber,
          employeename,
          locationType,
          custodyfrom,
          custodyto,
          createdat: new Date(),
          createdby: createdBy,
        };

        OPTIONAL_STRING_FIELDS.forEach((field) => {
          doc[field] = toOptionalString(mapped[field]);
        });

        docsToInsert.push(doc);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : `${rowLabel}: Invalid row`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed. Upload aborted; no records inserted.',
          errors,
        },
        { status: 400 }
      );
    }

    if (docsToInsert.length === 0) {
      return NextResponse.json({ error: 'No valid records found' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Backfill premisesLabel/location from master locations when only premisesId is provided in Excel.
    const premisesIdsToResolve = Array.from(
      new Set(
        docsToInsert
          .map((doc) => toOptionalString(doc.premisesId))
          .filter((id): id is string => Boolean(id))
          .filter((id) => ObjectId.isValid(id))
      )
    );

    if (premisesIdsToResolve.length > 0) {
      const locationDocs = await db
        .collection('locations')
        .find(
          { _id: { $in: premisesIdsToResolve.map((id) => new ObjectId(id)) } },
          { projection: { locationName: 1, buildingTower: 1 } }
        )
        .toArray();

      const locationById = new Map<string, { locationName?: string; buildingTower?: string }>(
        locationDocs.map((loc: any) => [String(loc._id), loc])
      );

      docsToInsert.forEach((doc) => {
        const premisesId = toOptionalString(doc.premisesId);
        if (!premisesId) return;

        const matchedLocation = locationById.get(premisesId);
        if (!matchedLocation) return;

        const fallbackLabel = toOptionalString(matchedLocation.locationName || matchedLocation.buildingTower);
        if (!fallbackLabel) return;

        const currentPremisesLabel = toOptionalString(doc.premisesLabel);
        const currentLocation = toOptionalString(doc.location);

        if (!currentPremisesLabel) {
          doc.premisesLabel = fallbackLabel;
        }
        if (!currentLocation) {
          doc.location = fallbackLabel;
        }
      });
    }

    const result = await db.collection('equipmentcustody').insertMany(docsToInsert);

    return NextResponse.json({
      success: true,
      inserted: result.insertedCount,
    });
  } catch (error) {
    console.error('Failed to import custody records:', error);
    return NextResponse.json({ error: 'Failed to import custody records' }, { status: 500 });
  }
}

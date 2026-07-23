import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

/**
 * Build a MongoDB regex pattern string from user search text.
 * - * is wildcard (any characters). E.g. *camp* -> match any string containing "camp".
 * - Plain text e.g. "camp" is treated as substring match (same as *camp*), case-insensitive.
 * - Result is safe for MongoDB $regex with $options: 'i'.
 */
function searchTextToRegexPattern(searchText: string): string {
  const trimmed = (searchText || '').trim();
  if (!trimmed) return '';
  // Escape regex special chars except *
  const escaped = trimmed.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  // Replace * with .*
  let pattern = escaped.replace(/\*/g, '.*');
  // If no * was used, treat as substring: wrap in .* for "contains"
  if (pattern === escaped && !trimmed.includes('*')) {
    pattern = '.*' + pattern + '.*';
  }
  return pattern;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'mme' | 'fixedasset'
    const search = searchParams.get('search') ?? searchParams.get('q') ?? '';

    if (!type || !['mme', 'fixedasset'].includes(type)) {
      return NextResponse.json(
        { error: 'Query param "type" is required and must be "mme" or "fixedasset"' },
        { status: 400 }
      );
    }

    const searchTrimmed = (search || '').trim();
    if (!searchTrimmed) {
      return NextResponse.json([]);
    }

    const { db, client } = await connectToDatabase();
    const defaultDb = db;
    const equipmentDb = client.db('equipment');

    const locationPattern = searchTextToRegexPattern(searchTrimmed);
    if (!locationPattern) {
      return NextResponse.json([]);
    }

    // Match custody: current (custodyto null) and any of the 3 location fields contains the text (case-insensitive).
    // All 3 are separate fields; a record can have warehouseLocation, departmentLocation, and/or campOfficeLocation.
    // Return the record if the search matches any of these fields.
    const custodyMatch: Record<string, unknown> = {
      custodyto: null,
      $or: [
        { warehouseLocation: { $regex: locationPattern, $options: 'i' } },
        { departmentLocation: { $regex: locationPattern, $options: 'i' } },
        { campOfficeLocation: { $regex: locationPattern, $options: 'i' } },
      ],
    };

    interface CustodyDoc {
      _id: unknown;
      assetnumber: string;
      locationType?: string;
      warehouseLocation?: string;
      departmentLocation?: string;
      campOfficeLocation?: string;
      employeenumber?: string;
      employeename?: string;
      custodyfrom?: unknown;
      custodyto?: unknown;
      project?: string;
      projectname?: string;
      warehouseCity?: string;
      [key: string]: unknown;
    }

    const custodyRecords = await defaultDb
      .collection<CustodyDoc>('equipmentcustody')
      .find(custodyMatch as Record<string, unknown>)
      .sort({ assetnumber: 1 })
      .toArray();

    // Filter by asset type: first digit 5 or 9 = MME (equipmentandtools), else fixed asset (fixedassets)
    const isMME = (assetNumber: string) => {
      const first = (assetNumber || '').toString().charAt(0);
      return first === '5' || first === '9';
    };

    const filtered =
      type === 'mme'
        ? custodyRecords.filter((r) => isMME(r.assetnumber))
        : custodyRecords.filter((r) => !isMME(r.assetnumber));

    if (filtered.length === 0) {
      return NextResponse.json([]);
    }

    const assetNumbers = filtered.map((r) => r.assetnumber);

    const collection = type === 'mme' ? 'equipmentandtools' : 'fixedassets';
    const sourceDb = type === 'mme' ? equipmentDb : defaultDb;
    const assetDetailsList = await sourceDb
      .collection(collection)
      .find({ assetnumber: { $in: assetNumbers } })
      .toArray();

    const detailsByAsset: Record<string, Record<string, unknown>> = {};
    for (const a of assetDetailsList) {
      const doc = a as Record<string, unknown>;
      const anum = doc.assetnumber as string | undefined;
      if (anum) detailsByAsset[anum] = doc;
    }

    const results = filtered.map((custody: CustodyDoc) => {
      const assetNumber = custody.assetnumber as string;
      const details = detailsByAsset[assetNumber] || {};
      const locationValue =
        custody.locationType === 'warehouse'
          ? custody.warehouseLocation
          : custody.locationType === 'camp/office'
            ? custody.campOfficeLocation
            : custody.departmentLocation;
      return {
        _id: custody._id,
        assetnumber: assetNumber,
        locationType: custody.locationType,
        locationValue: locationValue ?? '',
        campOfficeLocation: custody.campOfficeLocation,
        warehouseLocation: custody.warehouseLocation,
        departmentLocation: custody.departmentLocation,
        warehouseCity: custody.warehouseCity,
        employeenumber: custody.employeenumber,
        employeename: custody.employeename,
        custodyfrom: custody.custodyfrom,
        custodyto: custody.custodyto,
        project: custody.project,
        projectname: custody.projectname,
        assetdescription: details.assetdescription,
        assetcategory: details.assetcategory,
        assetsubcategory: details.assetsubcategory,
        assetstatus: details.assetstatus,
        assetmanufacturer: details.assetmanufacturer,
        assetmodel: details.assetmodel,
        assetserialnumber: details.assetserialnumber,
        acquireddate: details.acquireddate,
        acquiredvalue: details.acquiredvalue,
      };
    });

    return NextResponse.json(results);
  } catch (err) {
    console.error('Search by location failed:', err);
    return NextResponse.json(
      { error: 'Failed to search by location' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { isOpenCustody } from '@/lib/custodyRecords';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'all'; // 'all' | 'mme' | 'fixedasset'
    const search = (searchParams.get('search') || '').trim();
    const locationType = (searchParams.get('locationType') || '').trim(); // 'warehouse' | 'project_site' | 'camp/office' | 'department' | 'without_custodian'
    const city = (searchParams.get('city') || '').trim();
    const project = (searchParams.get('project') || '').trim();
    const employee = (searchParams.get('employee') || '').trim();
    const calibrationStatus = (searchParams.get('calibrationStatus') || '').trim(); // 'active' | 'expired' | 'not_required' | 'idle' | 'uncalibrated'
    const dateType = searchParams.get('dateType') || 'acquired'; // 'acquired' | 'custody' | 'calibration' | 'any'
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const exportAll = searchParams.get('exportAll') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = exportAll ? 10000 : Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50', 10)));

    const { db } = await connectToDatabase();

    // 1. Fetch raw assets based on scope
    const mmePromise = (scope === 'all' || scope === 'mme')
      ? db.collection('equipmentandtools').find({}).toArray()
      : Promise.resolve([]);

    const faPromise = (scope === 'all' || scope === 'fixedasset')
      ? db.collection('fixedassets').find({}).toArray()
      : Promise.resolve([]);

    const [mmeAssets, faAssets] = await Promise.all([mmePromise, faPromise]);

    // Tag each asset with scope
    const taggedMme = mmeAssets.map((a: any) => ({
      ...a,
      _scope: 'MME' as const,
      assetnumber: String(a.assetnumber || '').trim(),
    }));

    const taggedFa = faAssets.map((a: any) => ({
      ...a,
      _scope: 'Fixed Asset' as const,
      assetnumber: String(a.assetnumber || '').trim(),
    }));

    const allAssets = [...taggedMme, ...taggedFa].filter((a) => a.assetnumber);
    const assetNumbers = Array.from(new Set(allAssets.map((a) => a.assetnumber)));

    if (assetNumbers.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          records: [],
          total: 0,
          page: 1,
          limit,
          totalPages: 0,
          summary: {
            totalAssets: 0,
            mmeCount: 0,
            fixedAssetCount: 0,
            warehouseCount: 0,
            projectCount: 0,
            calibratedCount: 0,
            expiredCalibCount: 0,
          },
        },
      });
    }

    // 2. Fetch all custody records and calibration records for these assets
    const [custodyDocs, calibDocs] = await Promise.all([
      db.collection('equipmentcustody')
        .find({ assetnumber: { $in: assetNumbers } })
        .sort({ custodyfrom: -1 })
        .toArray(),
      db.collection('equipmentcalibcertificates')
        .find({ assetnumber: { $in: assetNumbers } })
        .sort({ calibrationtodate: -1, calibrationdate: -1 })
        .toArray(),
    ]);

    // Group custody by assetnumber
    const custodyMap = new Map<string, any[]>();
    for (const doc of custodyDocs) {
      const num = String(doc.assetnumber || '').trim();
      if (!custodyMap.has(num)) custodyMap.set(num, []);
      custodyMap.get(num)!.push(doc);
    }

    // Group calibrations by assetnumber
    const calibMap = new Map<string, any[]>();
    for (const doc of calibDocs) {
      const num = String(doc.assetnumber || '').trim();
      if (!calibMap.has(num)) calibMap.set(num, []);
      calibMap.get(num)!.push(doc);
    }

    const today = new Date();

    // 3. Enrich assets with custody, history, calibration, and computed status
    const enrichedList = allAssets.map((asset) => {
      const custodies = custodyMap.get(asset.assetnumber) || [];
      const calibs = calibMap.get(asset.assetnumber) || [];

      // Open / Current Custody
      const openCustody = custodies.find(isOpenCustody) || null;
      const historyCustody = custodies.filter((c) => !isOpenCustody(c));

      // Latest Calibration
      const latestCalib = calibs[0] || null;
      const historyCalibs = calibs.slice(1);

      // Determine Calibration Status
      let calibStatus: 'Active' | 'Expired' | 'Not Required' | 'In Idle Period' | 'Uncalibrated' = 'Uncalibrated';

      if (latestCalib) {
        if (latestCalib.calibrationRequired === 'Not Required') {
          calibStatus = 'Not Required';
        } else {
          const idleFrom = latestCalib.idlePeriodFrom ? new Date(latestCalib.idlePeriodFrom) : null;
          const idleTo = latestCalib.idlePeriodTo ? new Date(latestCalib.idlePeriodTo) : null;

          if (idleFrom && idleTo && today >= idleFrom && today <= idleTo) {
            calibStatus = 'In Idle Period';
          } else if (latestCalib.calibrationtodate) {
            const expDate = new Date(latestCalib.calibrationtodate);
            if (!Number.isNaN(expDate.getTime())) {
              calibStatus = expDate >= today ? 'Active' : 'Expired';
            }
          }
        }
      }

      // Format current custody location label
      const currentLocType = openCustody?.locationType || (custodies.length === 0 ? 'without_custodian' : 'historical_only');
      const currentCity = openCustody?.warehouseCity || openCustody?.custodyCity || openCustody?.departmentLocation || openCustody?.campOfficeLocation || '';
      const currentProject = openCustody?.projectname || openCustody?.project || '';
      const currentPremises = openCustody?.premisesLabel || openCustody?.premisesId || '';
      const currentDetail = [
        openCustody?.rackBinPallet ? `Rack: ${openCustody.rackBinPallet}` : '',
        openCustody?.shedRoomNumber ? `Shed: ${openCustody.shedRoomNumber}` : '',
        openCustody?.floorRoom ? `Room: ${openCustody.floorRoom}` : '',
        openCustody?.containerNumberRack ? `Container: ${openCustody.containerNumberRack}` : '',
      ].filter(Boolean).join(', ');

      return {
        _id: String(asset._id),
        assetnumber: asset.assetnumber,
        scope: asset._scope,
        assetdescription: asset.assetdescription || '',
        assetcategory: asset.assetcategory || '',
        assetsubcategory: asset.assetsubcategory || '',
        assetstatus: asset.assetstatus || 'In Service',
        assetmanufacturer: asset.assetmanufacturer || '',
        assetmodel: asset.assetmodel || '',
        assetserialnumber: asset.assetserialnumber || '',
        acquireddate: asset.acquireddate ? new Date(asset.acquireddate) : null,
        acquiredvalue: Number(asset.acquiredvalue) || 0,
        legacyassetnumber: asset.legacyassetnumber || '',
        accessories: asset.accessories || '',
        assetnotes: asset.assetnotes || '',
        anyotheridentifier: asset.anyotheridentifier || '',

        // Current Custody
        hasCustodian: !!openCustody,
        currentCustodian: openCustody ? {
          employeenumber: openCustody.employeenumber || '',
          employeename: openCustody.employeename || '',
          locationType: openCustody.locationType || '',
          city: currentCity,
          project: currentProject,
          premises: currentPremises,
          details: currentDetail,
          custodyfrom: openCustody.custodyfrom ? new Date(openCustody.custodyfrom) : null,
          documentnumber: openCustody.documentnumber || '',
          remarks: openCustody.custodyRemark || openCustody.location || '',
        } : null,

        // Custody History
        custodyCount: custodies.length,
        custodyHistory: historyCustody.map((c) => ({
          _id: String(c._id),
          employeenumber: c.employeenumber || '',
          employeename: c.employeename || '',
          locationType: c.locationType || '',
          city: c.warehouseCity || c.custodyCity || c.departmentLocation || c.campOfficeLocation || '',
          project: c.projectname || c.project || '',
          custodyfrom: c.custodyfrom ? new Date(c.custodyfrom) : null,
          custodyto: c.custodyto ? new Date(c.custodyto) : null,
          documentnumber: c.documentnumber || '',
          remarks: c.custodyRemark || c.location || '',
        })),

        // Calibration Details
        calibrationStatus: calibStatus,
        latestCalibration: latestCalib ? {
          _id: String(latestCalib._id),
          calibrationRequired: latestCalib.calibrationRequired || 'Required',
          calibratedby: latestCalib.calibratedby || '',
          calibrationdate: latestCalib.calibrationdate ? new Date(latestCalib.calibrationdate) : null,
          calibrationtodate: latestCalib.calibrationtodate ? new Date(latestCalib.calibrationtodate) : null,
          calibrationpo: latestCalib.calibrationpo || '',
          calibcertificate: latestCalib.calibcertificate || latestCalib.calibfile || '',
          idlePeriodFrom: latestCalib.idlePeriodFrom ? new Date(latestCalib.idlePeriodFrom) : null,
          idlePeriodTo: latestCalib.idlePeriodTo ? new Date(latestCalib.idlePeriodTo) : null,
        } : null,

        // Calibration History
        calibrationCount: calibs.length,
        calibrationHistory: historyCalibs.map((cal) => ({
          _id: String(cal._id),
          calibrationRequired: cal.calibrationRequired || 'Required',
          calibratedby: cal.calibratedby || '',
          calibrationdate: cal.calibrationdate ? new Date(cal.calibrationdate) : null,
          calibrationtodate: cal.calibrationtodate ? new Date(cal.calibrationtodate) : null,
          calibrationpo: cal.calibrationpo || '',
          calibcertificate: cal.calibcertificate || cal.calibfile || '',
        })),
      };
    });

    // 4. Apply Filters
    let filtered = enrichedList;

    // Search query filter
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((item) =>
        item.assetnumber.toLowerCase().includes(q) ||
        item.assetdescription.toLowerCase().includes(q) ||
        item.assetmanufacturer.toLowerCase().includes(q) ||
        item.assetmodel.toLowerCase().includes(q) ||
        item.assetserialnumber.toLowerCase().includes(q) ||
        item.assetcategory.toLowerCase().includes(q) ||
        item.assetsubcategory.toLowerCase().includes(q) ||
        item.currentCustodian?.employeename?.toLowerCase().includes(q) ||
        item.currentCustodian?.employeenumber?.toLowerCase().includes(q) ||
        item.currentCustodian?.project?.toLowerCase().includes(q) ||
        item.currentCustodian?.city?.toLowerCase().includes(q)
      );
    }

    // Location Type filter
    if (locationType) {
      if (locationType === 'without_custodian') {
        filtered = filtered.filter((item) => !item.hasCustodian);
      } else {
        filtered = filtered.filter((item) => item.currentCustodian?.locationType?.toLowerCase() === locationType.toLowerCase());
      }
    }

    // City / Warehouse filter
    if (city) {
      const cLower = city.toLowerCase();
      filtered = filtered.filter((item) =>
        item.currentCustodian?.city?.toLowerCase().includes(cLower)
      );
    }

    // Project filter
    if (project) {
      const pLower = project.toLowerCase();
      filtered = filtered.filter((item) =>
        item.currentCustodian?.project?.toLowerCase().includes(pLower)
      );
    }

    // Custodian employee filter
    if (employee) {
      const eLower = employee.toLowerCase();
      filtered = filtered.filter((item) =>
        item.currentCustodian?.employeenumber?.toLowerCase().includes(eLower) ||
        item.currentCustodian?.employeename?.toLowerCase().includes(eLower)
      );
    }

    // Calibration status filter
    if (calibrationStatus) {
      const sLower = calibrationStatus.toLowerCase();
      if (sLower === 'active') {
        filtered = filtered.filter((item) => item.calibrationStatus === 'Active');
      } else if (sLower === 'expired') {
        filtered = filtered.filter((item) => item.calibrationStatus === 'Expired');
      } else if (sLower === 'not_required') {
        filtered = filtered.filter((item) => item.calibrationStatus === 'Not Required');
      } else if (sLower === 'idle') {
        filtered = filtered.filter((item) => item.calibrationStatus === 'In Idle Period');
      } else if (sLower === 'uncalibrated') {
        filtered = filtered.filter((item) => item.calibrationStatus === 'Uncalibrated');
      }
    }

    // Date range filter
    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom).getTime() : 0;
      const to = dateTo ? new Date(`${dateTo}T23:59:59.999Z`).getTime() : Infinity;

      filtered = filtered.filter((item) => {
        if (dateType === 'acquired') {
          if (!item.acquireddate) return false;
          const t = item.acquireddate.getTime();
          return t >= from && t <= to;
        }
        if (dateType === 'custody') {
          if (!item.currentCustodian?.custodyfrom) return false;
          const t = item.currentCustodian.custodyfrom.getTime();
          return t >= from && t <= to;
        }
        if (dateType === 'calibration') {
          if (!item.latestCalibration?.calibrationtodate) return false;
          const t = item.latestCalibration.calibrationtodate.getTime();
          return t >= from && t <= to;
        }
        if (dateType === 'any') {
          const acqT = item.acquireddate?.getTime() || 0;
          const custT = item.currentCustodian?.custodyfrom?.getTime() || 0;
          const calT = item.latestCalibration?.calibrationtodate?.getTime() || 0;
          return (acqT >= from && acqT <= to) || (custT >= from && custT <= to) || (calT >= from && calT <= to);
        }
        return true;
      });
    }

    // Sort by assetnumber ascending or descending
    filtered.sort((a, b) => a.assetnumber.localeCompare(b.assetnumber, undefined, { numeric: true }));

    // Global KPI Summary calculated over the filtered set
    const summary = {
      totalAssets: filtered.length,
      mmeCount: filtered.filter((i) => i.scope === 'MME').length,
      fixedAssetCount: filtered.filter((i) => i.scope === 'Fixed Asset').length,
      warehouseCount: filtered.filter((i) => i.currentCustodian?.locationType === 'warehouse').length,
      projectCount: filtered.filter((i) => i.currentCustodian?.locationType === 'project_site').length,
      calibratedCount: filtered.filter((i) => i.calibrationStatus === 'Active').length,
      expiredCalibCount: filtered.filter((i) => i.calibrationStatus === 'Expired').length,
    };

    // Paginate results
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const paginatedRecords = exportAll ? filtered : filtered.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: {
        records: paginatedRecords,
        total,
        page,
        limit,
        totalPages,
        summary,
      },
    });
  } catch (error: any) {
    console.error('Error fetching comprehensive asset & MME data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comprehensive reports' },
      { status: 500 }
    );
  }
}

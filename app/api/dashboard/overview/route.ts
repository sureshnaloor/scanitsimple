import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import type { DashboardOverviewResponse } from '@/types/dashboard';

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function mergeCounts(
  rows: { _id: unknown; value: number }[],
  into: Map<string, number>
) {
  for (const r of rows) {
    const key =
      r._id === null || r._id === undefined || r._id === ''
        ? 'Unknown'
        : String(r._id).trim() || 'Unknown';
    into.set(key, (into.get(key) ?? 0) + r.value);
  }
}

function mapToChartSlices(m: Map<string, number>, maxSlices = 12): { name: string; value: number }[] {
  const arr = Array.from(m.entries())
    .map(([name, value]) => ({ name, value }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);
  if (arr.length <= maxSlices) return arr;
  const head = arr.slice(0, maxSlices - 1);
  const rest = arr.slice(maxSlices - 1).reduce((s, x) => s + x.value, 0);
  return [...head, { name: 'Other', value: rest }];
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const now = new Date();
    const som = startOfMonth(now);
    const soon = new Date(now.getTime() + 30 * 86400000);

    const mmeCol = db.collection('equipmentandtools');
    const fixedCol = db.collection('fixedassets');
    const custodyCol = db.collection('equipmentcustody');
    const calibCol = db.collection('equipmentcalibcertificates');
    const ppeCol = db.collection('ppe-records');
    const returnsCol = db.collection('projreturnmaterials');

    const [
      mmeCount,
      fixedCount,
      mmeStatusAgg,
      fixedStatusAgg,
      mmeCatAgg,
      fixedCatAgg,
      addedMme,
      addedFixed,
    ] = await Promise.all([
      mmeCol.countDocuments({}),
      fixedCol.countDocuments({}),
      mmeCol
        .aggregate([{ $group: { _id: '$assetstatus', value: { $sum: 1 } } }])
        .toArray(),
      fixedCol
        .aggregate([{ $group: { _id: '$assetstatus', value: { $sum: 1 } } }])
        .toArray(),
      mmeCol
        .aggregate([{ $group: { _id: '$assetcategory', value: { $sum: 1 } } }])
        .toArray(),
      fixedCol
        .aggregate([{ $group: { _id: '$assetcategory', value: { $sum: 1 } } }])
        .toArray(),
      mmeCol.countDocuments({ acquireddate: { $gte: som } }).catch(() => 0),
      fixedCol.countDocuments({ acquireddate: { $gte: som } }).catch(() => 0),
    ]);

    const statusMap = new Map<string, number>();
    mergeCounts(mmeStatusAgg as { _id: unknown; value: number }[], statusMap);
    mergeCounts(fixedStatusAgg as { _id: unknown; value: number }[], statusMap);

    const categoryMap = new Map<string, number>();
    mergeCounts(mmeCatAgg as { _id: unknown; value: number }[], categoryMap);
    mergeCounts(fixedCatAgg as { _id: unknown; value: number }[], categoryMap);

    const activeCustody = await custodyCol
      .aggregate([
        { $match: { $or: [{ custodyto: null }, { custodyto: { $exists: false } }] } },
        { $group: { _id: '$assetnumber' } },
        { $count: 'n' },
      ])
      .toArray();
    const assetsInCustody = activeCustody[0]?.n ?? 0;

    const totalAssets = mmeCount + fixedCount;
    const custodyPercent =
      totalAssets > 0 ? Math.round((assetsInCustody / totalAssets) * 1000) / 10 : 0;

    const latestCalibrations = await calibCol
      .aggregate([
        {
          $addFields: {
            exp: {
              $convert: {
                input: '$calibrationtodate',
                to: 'date',
                onError: null,
                onNull: null,
              },
            },
          },
        },
        { $match: { exp: { $ne: null } } },
        { $sort: { assetnumber: 1, exp: -1 } },
        {
          $group: {
            _id: '$assetnumber',
            latestExp: { $first: '$exp' },
          },
        },
      ])
      .toArray();

    let expiredCalibrations = 0;
    let calibrationsDueSoon = 0;
    for (const row of latestCalibrations) {
      const exp = row.latestExp as Date;
      if (!(exp instanceof Date) || Number.isNaN(exp.getTime())) continue;
      if (exp < now) expiredCalibrations += 1;
      else if (exp <= soon) calibrationsDueSoon += 1;
    }

    const upcomingCalibrationsRaw = await calibCol
      .aggregate([
        {
          $addFields: {
            exp: {
              $convert: {
                input: '$calibrationtodate',
                to: 'date',
                onError: null,
                onNull: null,
              },
            },
          },
        },
        { $match: { exp: { $gt: now } } },
        { $sort: { assetnumber: 1, exp: 1 } },
        {
          $group: {
            _id: '$assetnumber',
            nextExp: { $first: '$exp' },
            calibratedby: { $first: '$calibratedby' },
          },
        },
        { $sort: { nextExp: 1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'equipmentandtools',
            localField: '_id',
            foreignField: 'assetnumber',
            as: 'mme',
          },
        },
        {
          $lookup: {
            from: 'fixedassets',
            localField: '_id',
            foreignField: 'assetnumber',
            as: 'fx',
          },
        },
        {
          $project: {
            assetnumber: '$_id',
            calibrationtodate: '$nextExp',
            calibratedby: 1,
            assetdescription: {
              $ifNull: [{ $arrayElemAt: ['$mme.assetdescription', 0] }, { $arrayElemAt: ['$fx.assetdescription', 0] }],
            },
          },
        },
      ])
      .toArray();

    const recentCustody = await custodyCol
      .find(
        {},
        {
          projection: {
            assetnumber: 1,
            employeename: 1,
            employeenumber: 1,
            locationType: 1,
            location: 1,
            custodyfrom: 1,
          },
        }
      )
      .sort({ custodyfrom: -1 })
      .limit(8)
      .toArray();

    const recentPpe = await ppeCol
      .find(
        {},
        {
          projection: {
            userEmpName: 1,
            userEmpNumber: 1,
            ppeName: 1,
            quantityIssued: 1,
            dateOfIssue: 1,
            issuedByName: 1,
          },
        }
      )
      .sort({ dateOfIssue: -1 })
      .limit(8)
      .toArray();

    const recentProjectReturns = await returnsCol
      .find(
        { disposed: { $ne: true } },
        {
          projection: {
            materialid: 1,
            materialCode: 1,
            materialDescription: 1,
            quantity: 1,
            uom: 1,
            sourceProject: 1,
            createdAt: 1,
          },
        }
      )
      .sort({ createdAt: -1, _id: -1 })
      .limit(10)
      .toArray();

    const payload: DashboardOverviewResponse = {
      success: true,
      summary: {
        totalAssets,
        mmeCount,
        fixedAssetCount: fixedCount,
        assetsInCustody,
        custodyPercent,
        assetsAddedThisMonth: addedMme + addedFixed,
        calibrationsDueSoon,
        expiredCalibrations,
      },
      assetStatus: mapToChartSlices(statusMap, 10),
      assetTypeDistribution: mapToChartSlices(categoryMap, 8).map((x) => ({ label: x.name, value: x.value })),
      recentCustody: recentCustody.map((d) => ({
        assetnumber: String(d.assetnumber ?? ''),
        employeename: d.employeename as string | undefined,
        employeenumber: d.employeenumber as string | undefined,
        locationType: d.locationType as string | undefined,
        location: d.location as string | undefined,
        custodyfrom: d.custodyfrom ? new Date(d.custodyfrom as Date).toISOString() : null,
      })),
      upcomingCalibrations: upcomingCalibrationsRaw.map((d) => ({
        assetnumber: String(d.assetnumber ?? ''),
        calibrationtodate: d.calibrationtodate ? new Date(d.calibrationtodate as Date).toISOString() : null,
        assetdescription: d.assetdescription as string | undefined,
        calibratedby: d.calibratedby as string | undefined,
      })),
      recentPpe: recentPpe.map((d) => ({
        _id: String(d._id),
        userEmpName: String(d.userEmpName ?? ''),
        userEmpNumber: String(d.userEmpNumber ?? ''),
        ppeName: String(d.ppeName ?? ''),
        quantityIssued: Number(d.quantityIssued ?? 0),
        dateOfIssue: d.dateOfIssue ? new Date(d.dateOfIssue as Date).toISOString() : null,
        issuedByName: d.issuedByName as string | undefined,
      })),
      recentProjectReturns: recentProjectReturns.map((d) => ({
        materialid: String(d.materialid ?? ''),
        materialCode: String(d.materialCode ?? ''),
        materialDescription: String(d.materialDescription ?? ''),
        quantity: Number(d.quantity ?? 0),
        uom: String(d.uom ?? ''),
        sourceProject: d.sourceProject as string | undefined,
        createdAt: d.createdAt ? new Date(d.createdAt as Date).toISOString() : null,
      })),
    };

    return NextResponse.json(payload);
  } catch (e) {
    console.error('Dashboard overview error:', e);
    return NextResponse.json({ success: false, error: 'Failed to load dashboard' }, { status: 500 });
  }
}

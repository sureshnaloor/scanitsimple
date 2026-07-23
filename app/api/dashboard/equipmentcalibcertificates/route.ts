import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import type { DashboardCollectionMetaResponse } from '@/types/dashboard';

/**
 * Summarises `equipmentcalibcertificates` for dashboards and schema discovery.
 * Returns a small sample (redacted to common fields) plus inferred field keys from one document.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const col = db.collection('equipmentcalibcertificates');

    const [documentCount, sample, recent] = await Promise.all([
      col.countDocuments({}),
      col.findOne({}),
      col
        .find(
          {},
          {
            projection: {
              assetnumber: 1,
              calibratedby: 1,
              calibrationdate: 1,
              calibrationtodate: 1,
              calibrationpo: 1,
              createdby: 1,
              createdat: 1,
            },
          }
        )
        .sort({ createdat: -1 })
        .limit(5)
        .toArray(),
    ]);

    const inferredFields = sample && typeof sample === 'object' ? Object.keys(sample).sort() : [];

    const body: DashboardCollectionMetaResponse = {
      collection: 'equipmentcalibcertificates',
      documentCount,
      inferredFields,
      recentDocuments: recent.map((d) => {
        const o = { ...d } as Record<string, unknown>;
        if (o._id) o._id = String(o._id);
        return o;
      }),
    };

    return NextResponse.json({ success: true, ...body });
  } catch (e) {
    console.error('equipmentcalibcertificates meta:', e);
    return NextResponse.json({ success: false, error: 'Failed to read collection' }, { status: 500 });
  }
}

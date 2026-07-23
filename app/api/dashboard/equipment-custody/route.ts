import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import type { DashboardCollectionMetaResponse } from '@/types/dashboard';

/**
 * Summarises `equipmentcustody` for dashboards and schema discovery.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const col = db.collection('equipmentcustody');

    const [documentCount, sample, recent] = await Promise.all([
      col.countDocuments({}),
      col.findOne({}),
      col
        .find(
          {},
          {
            projection: {
              assetnumber: 1,
              employeenumber: 1,
              employeename: 1,
              locationType: 1,
              location: 1,
              warehouseLocation: 1,
              departmentLocation: 1,
              campOfficeLocation: 1,
              project: 1,
              projectname: 1,
              custodyfrom: 1,
              custodyto: 1,
              createdat: 1,
            },
          }
        )
        .sort({ custodyfrom: -1 })
        .limit(5)
        .toArray(),
    ]);

    const inferredFields = sample && typeof sample === 'object' ? Object.keys(sample).sort() : [];

    const body: DashboardCollectionMetaResponse = {
      collection: 'equipmentcustody',
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
    console.error('equipmentcustody meta:', e);
    return NextResponse.json({ success: false, error: 'Failed to read collection' }, { status: 500 });
  }
}

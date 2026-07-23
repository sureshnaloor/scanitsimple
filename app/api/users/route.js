import { connectToDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    // Get unique users from current custody records
    const users = await db.collection('equipmentcustody')
      .aggregate([
        { 
          $match: { 
            custodyto: null 
          } 
        },
        {
          $group: {
            _id: '$employeenumber',
            employeenumber: { $first: '$employeenumber' },
            employeename: { $first: '$employeename' }
          }
        },
        {
          $sort: { employeename: 1 }
        }
      ])
      .toArray();

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
} 
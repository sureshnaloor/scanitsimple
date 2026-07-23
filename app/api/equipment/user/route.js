import { connectToDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Request body:', body);
    
    const { employeeNumber } = body;
    const { db } = await connectToDatabase();

    // Use aggregation pipeline to lookup asset details from both collections
    const equipment = await db.collection('equipmentcustody')
      .aggregate([
        {
          $match: {
            employeenumber: employeeNumber,
            custodyto: null
          }
        },
        {
          // Lookup from equipmentandtools collection
          $lookup: {
            from: 'equipmentandtools',
            let: { asset: '$assetnumber' },
            pipeline: [
              { $match: { $expr: { $eq: ['$assetnumber', '$$asset'] } } }
            ],
            as: 'equipmentDetails'
          }
        },
        {
          // Lookup from fixedassets collection
          $lookup: {
            from: 'fixedassets',
            let: { asset: '$assetnumber' },
            pipeline: [
              { $match: { $expr: { $eq: ['$assetnumber', '$$asset'] } } }
            ],
            as: 'fixedAssetDetails'
          }
        },
        {
          // Determine which collection to use based on first digit
          $addFields: {
            firstDigit: { $substr: [{ $toString: '$assetnumber' }, 0, 1] }
          }
        },
        {
          $addFields: {
            assetDetails: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ['$firstDigit', '5'] },
                    { $eq: ['$firstDigit', '9'] }
                  ]
                },
                then: { $arrayElemAt: ['$equipmentDetails', 0] },
                else: { $arrayElemAt: ['$fixedAssetDetails', 0] }
              }
            }
          }
        },
        {
          // Project final fields including asset description
          $project: {
            _id: 1,
            assetnumber: 1,
            employeenumber: 1,
            employeename: 1,
            custodyfrom: 1,
            custodyto: 1,
            project: 1,
            assetdescription: '$assetDetails.assetdescription',
            assetstatus: '$assetDetails.assetstatus',
            assetmodel: '$assetDetails.assetmodel',
            assetmanufacturer: '$assetDetails.assetmanufacturer',
            assetserialnumber: '$assetDetails.assetserialnumber'
          }
        },
        {
          $sort: {
            assetnumber: 1
          }
        }
      ])
      .toArray();

    // Log the results
    console.log('Found equipment count:', equipment.length);
    if (equipment.length > 0) {
      console.log('Sample record:', equipment[0]);
    }

    return NextResponse.json({ equipment });
  } catch (error) {
    console.error('Error fetching user equipment:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 
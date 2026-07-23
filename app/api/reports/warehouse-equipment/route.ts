import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const sortField = searchParams.get('sortField') || 'assetnumber';
        const sortOrder = searchParams.get('sortOrder') === 'desc' ? -1 : 1;

        const { db } = await connectToDatabase();

        // Aggregate pipeline to join collections and get required data
        const warehouseEquipment = await db.collection('equipmentcustody')
            .aggregate([
                {
                    $match: {
                        warehouseCity: { $in: ['Dammam', 'Jubail'] },
                        custodyto: null
                    }
                },
                {
                    $lookup: {
                        from: 'equipmentandtools',
                        localField: 'assetnumber',
                        foreignField: 'assetnumber',
                        as: 'equipmentDetails'
                    }
                },
                {
                    $unwind: '$equipmentDetails'
                },
                {
                    $project: {
                        assetnumber: '$equipmentDetails.assetnumber',
                        assetdescription: '$equipmentDetails.assetdescription',
                        assetstatus: '$equipmentDetails.assetstatus',
                        assetmodel: '$equipmentDetails.assetmodel',
                        assetmanufacturer: '$equipmentDetails.assetmanufacturer',
                        assetserialnumber: '$equipmentDetails.assetserialnumber',
                        warehouseCity: 1
                    }
                },
                {
                    $sort: {
                        [sortField]: sortOrder
                    }
                }
            ]).toArray();

        return NextResponse.json({ data: warehouseEquipment }, { status: 200 });
    } catch (error) {
        console.error('Error fetching warehouse equipment:', error);
        return NextResponse.json(
            { error: 'Failed to fetch warehouse equipment' },
            { status: 500 }
        );
    }
} 
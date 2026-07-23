import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const sortField = searchParams.get('sortField') || 'assetnumber';
        const sortOrder = searchParams.get('sortOrder') === 'desc' ? -1 : 1;

        const { db } = await connectToDatabase();
        
        // First, let's get all calibration records and handle dates properly
        const expiredCalibrations = await db.collection('equipmentcalibcertificates')
            .aggregate([
                // First convert string dates to actual Date objects
                {
                    $addFields: {
                        calibrationtodate: { $toDate: "$calibrationtodate" }
                    }
                },
                // Group by asset and get the latest calibration record
                {
                    $group: {
                        _id: "$assetnumber",
                        doc: {
                            $max: {
                                calibrationdate: "$calibrationdate",
                                calibrationtodate: "$calibrationtodate",
                                calibratedby: "$calibratedby",
                                calibcertificate: "$calibcertificate",
                                assetnumber: "$assetnumber"
                            }
                        }
                    }
                },
                // Now match for expired calibrations
                {
                    $match: {
                        "doc.calibrationtodate": { 
                            $lt: new Date() 
                        }
                    }
                },
                // Lookup equipment details
                {
                    $lookup: {
                        from: 'equipmentandtools',
                        localField: '_id',
                        foreignField: 'assetnumber',
                        as: 'equipmentDetails'
                    }
                },
                {
                    $unwind: '$equipmentDetails'
                },
                // Project final fields
                {
                    $project: {
                        _id: 0,
                        assetnumber: '$_id',
                        assetdescription: '$equipmentDetails.assetdescription',
                        calibrationdate: '$doc.calibrationdate',
                        calibrationtodate: '$doc.calibrationtodate',
                        calibratedby: '$doc.calibratedby',
                        calibcertificate: '$doc.calibcertificate',
                        assetmodel: '$equipmentDetails.assetmodel',
                        assetmanufacturer: '$equipmentDetails.assetmanufacturer'
                    }
                },
                {
                    $sort: {
                        [sortField]: sortOrder
                    }
                }
            ]).toArray();

        // Log the count for debugging
        console.log('Found expired calibrations:', expiredCalibrations.length);

        return NextResponse.json({ data: expiredCalibrations }, { status: 200 });
    } catch (error) {
        console.error('Error fetching expired calibrations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch expired calibrations' },
            { status: 500 }
        );
    }
} 
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const minValue = searchParams.get('minValue');
        const maxValue = searchParams.get('maxValue');
        const minDate = searchParams.get('minDate');
        const maxDate = searchParams.get('maxDate');
        const searchType = searchParams.get('searchType'); // 'dammam', 'jubail', 'with_users', 'not_traced', 'mme', 'fixed_assets'
        const assetType = searchParams.get('assetType'); // 'mme' or 'fixed_assets'
        const sortField = searchParams.get('sortField') || 'assetnumber';
        const sortOrder = searchParams.get('sortOrder') === 'desc' ? -1 : 1;

        // Require at least one filter to avoid loading full dataset
        if (!minValue && !maxValue && !minDate && !maxDate && !searchType) {
            return NextResponse.json(
                { error: 'At least one filter is required' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();
        
        // Determine source collection
        const sourceCollection = assetType === 'fixed_assets' ? 'fixedassets' : 'equipmentandtools';
        
        // Build base match conditions for value and date filters
        const baseMatch: any = {};
        
        if (minValue || maxValue) {
            baseMatch.acquiredvalue = {};
            if (minValue) baseMatch.acquiredvalue.$gte = parseFloat(minValue);
            if (maxValue) baseMatch.acquiredvalue.$lte = parseFloat(maxValue);
        }
        
        if (minDate || maxDate) {
            baseMatch.acquireddate = {};
            if (minDate) baseMatch.acquireddate.$gte = new Date(minDate);
            if (maxDate) baseMatch.acquireddate.$lte = new Date(maxDate);
        }

        let pipeline: any[] = [];

        switch (searchType) {
            case 'dammam':
                // Assets in Dammam warehouse
                pipeline = [
                    { $match: baseMatch },
                    {
                        $lookup: {
                            from: 'equipmentcustody',
                            localField: 'assetnumber',
                            foreignField: 'assetnumber',
                            as: 'custodyRecords'
                        }
                    },
                    {
                        $match: {
                            'custodyRecords.warehouseCity': 'Dammam',
                            'custodyRecords.custodyto': null
                        }
                    },
                    {
                        $project: {
                            assetnumber: 1,
                            assetdescription: 1,
                            assetstatus: 1,
                            assetmodel: 1,
                            assetmanufacturer: 1,
                            assetserialnumber: 1,
                            acquireddate: 1,
                            acquiredvalue: 1,
                            assetcategory: 1,
                            assetsubcategory: 1,
                            assetnotes: 1,
                            accessories: 1,
                            location: 'Dammam Warehouse',
                            custodyDetails: { $arrayElemAt: ['$custodyRecords', 0] }
                        }
                    }
                ];
                break;

            case 'jubail':
                // Assets in Jubail warehouse
                pipeline = [
                    { $match: baseMatch },
                    {
                        $lookup: {
                            from: 'equipmentcustody',
                            localField: 'assetnumber',
                            foreignField: 'assetnumber',
                            as: 'custodyRecords'
                        }
                    },
                    {
                        $match: {
                            'custodyRecords.warehouseCity': 'Jubail',
                            'custodyRecords.custodyto': null
                        }
                    },
                    {
                        $project: {
                            assetnumber: 1,
                            assetdescription: 1,
                            assetstatus: 1,
                            assetmodel: 1,
                            assetmanufacturer: 1,
                            assetserialnumber: 1,
                            acquireddate: 1,
                            acquiredvalue: 1,
                            assetcategory: 1,
                            assetsubcategory: 1,
                            assetnotes: 1,
                            accessories: 1,
                            location: 'Jubail Warehouse',
                            custodyDetails: { $arrayElemAt: ['$custodyRecords', 0] }
                        }
                    }
                ];
                break;

            case 'with_users':
                // Assets with user custody (not in warehouse)
                pipeline = [
                    { $match: baseMatch },
                    {
                        $lookup: {
                            from: 'equipmentcustody',
                            localField: 'assetnumber',
                            foreignField: 'assetnumber',
                            as: 'custodyRecords'
                        }
                    },
                    {
                        $match: {
                            'custodyRecords.custodyto': null,
                            'custodyRecords.locationType': { $in: ['department', 'project_site', 'camp/office'] }
                        }
                    },
                    {
                        $project: {
                            assetnumber: 1,
                            assetdescription: 1,
                            assetstatus: 1,
                            assetmodel: 1,
                            assetmanufacturer: 1,
                            assetserialnumber: 1,
                            acquireddate: 1,
                            acquiredvalue: 1,
                            assetcategory: 1,
                            assetsubcategory: 1,
                            assetnotes: 1,
                            accessories: 1,
                            location: 'With Users',
                            custodyDetails: { $arrayElemAt: ['$custodyRecords', 0] }
                        }
                    }
                ];
                break;

            case 'not_traced':
                // Assets without any custody information
                pipeline = [
                    { $match: baseMatch },
                    {
                        $lookup: {
                            from: 'equipmentcustody',
                            localField: 'assetnumber',
                            foreignField: 'assetnumber',
                            as: 'custodyRecords'
                        }
                    },
                    {
                        $match: {
                            custodyRecords: { $size: 0 }
                        }
                    },
                    {
                        $project: {
                            assetnumber: 1,
                            assetdescription: 1,
                            assetstatus: 1,
                            assetmodel: 1,
                            assetmanufacturer: 1,
                            assetserialnumber: 1,
                            acquireddate: 1,
                            acquiredvalue: 1,
                            assetcategory: 1,
                            assetsubcategory: 1,
                            assetnotes: 1,
                            accessories: 1,
                            location: 'Not Traced',
                            custodyDetails: null
                        }
                    }
                ];
                break;

            case 'mme':
            case 'fixed_assets':
            default:
                // Just filter by asset type and value/date filters
                pipeline = [
                    { $match: baseMatch },
                    {
                        $project: {
                            assetnumber: 1,
                            assetdescription: 1,
                            assetstatus: 1,
                            assetmodel: 1,
                            assetmanufacturer: 1,
                            assetserialnumber: 1,
                            acquireddate: 1,
                            acquiredvalue: 1,
                            assetcategory: 1,
                            assetsubcategory: 1,
                            assetnotes: 1,
                            accessories: 1,
                            location: 'All Assets',
                            custodyDetails: null
                        }
                    }
                ];
                break;
        }

        // Add sorting
        pipeline.push({
            $sort: {
                [sortField]: sortOrder
            }
        });

        const results = await db.collection(sourceCollection)
            .aggregate(pipeline)
            .toArray();

        return NextResponse.json({ 
            data: results,
            total: results.length,
            searchType,
            assetType: assetType || 'mme'
        }, { status: 200 });

    } catch (error) {
        console.error('Error searching assets:', error);
        return NextResponse.json(
            { error: 'Failed to search assets' },
            { status: 500 }
        );
    }
}

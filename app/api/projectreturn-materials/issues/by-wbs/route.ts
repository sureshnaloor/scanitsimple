import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/auth';

// Function to calculate unit rate at time of issue based on age
function calculateUnitRateAtIssue(
  sourceUnitRate: number,
  receivedDate?: Date | string,
  issueDate?: Date | string
): number {
  if (!receivedDate || !sourceUnitRate || !issueDate) {
    return sourceUnitRate || 0;
  }

  const received = new Date(receivedDate);
  const issue = new Date(issueDate);
  
  // Check if dates are valid
  if (isNaN(received.getTime()) || isNaN(issue.getTime())) {
    return sourceUnitRate || 0;
  }

  const diffTime = issue.getTime() - received.getTime();
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25); // Account for leap years

  let percentage = 0.25; // Default for more than 3 years

  if (diffYears <= 1) {
    percentage = 0.5; // 50% for within 1 year
  } else if (diffYears <= 2) {
    percentage = 0.4; // 40% for 1-2 years
  } else if (diffYears <= 3) {
    percentage = 0.3; // 30% for 2-3 years
  }

  return sourceUnitRate * percentage;
}

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Fetch all issues
    const issues = await db
      .collection('projreturnissues')
      .find({})
      .sort({ issueDate: -1 })
      .toArray();

    // Fetch material details for each issue to get sourceUnitRate and receivedInWarehouseDate
    const issuesWithMaterialDetails = await Promise.all(
      issues.map(async (issue) => {
        const material = await db
          .collection('projreturnmaterials')
          .findOne({ materialid: issue.materialid });

        if (!material) {
          return {
            ...issue,
            materialCode: 'N/A',
            materialDescription: 'Material not found',
            sourceUnitRate: 0,
            originalValue: 0,
            valueAtIssue: 0,
          };
        }

        const sourceUnitRate = material.sourceUnitRate || 0;
        const originalValue = sourceUnitRate * (issue.issueQuantity || 0);
        const unitRateAtIssue = calculateUnitRateAtIssue(
          sourceUnitRate,
          material.receivedInWarehouseDate,
          issue.issueDate
        );
        const valueAtIssue = unitRateAtIssue * (issue.issueQuantity || 0);

        return {
          ...issue,
          materialCode: material.materialCode || 'N/A',
          materialDescription: material.materialDescription || 'N/A',
          sourceUnitRate,
          originalValue,
          unitRateAtIssue,
          valueAtIssue,
        };
      })
    );

    return NextResponse.json(issuesWithMaterialDetails);
  } catch (err) {
    console.error('Failed to fetch issues by WBS:', err);
    return NextResponse.json(
      { error: 'Failed to fetch issues by WBS' },
      { status: 500 }
    );
  }
}



import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { PPEDueForReissue, PPEApiResponse } from '@/types/ppe';

// GET - Fetch PPE items due for reissue
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const daysOverdue = parseInt(searchParams.get('daysOverdue') || '0');
    const ppeId = searchParams.get('ppeId');
    const userEmpNumber = searchParams.get('userEmpNumber');

    const { db } = await connectToDatabase();
    
    // Get all PPE master records
    const ppeMasterCollection = db.collection('ppe-master');
    const ppeMasterRecords = await ppeMasterCollection.find({ isActive: true }).toArray();
    
    // Get all PPE issue records
    const ppeRecordsCollection = db.collection('ppe-records');
    
    let query: any = {};
    if (ppeId) {
      query.ppeId = ppeId;
    }
    if (userEmpNumber) {
      query.userEmpNumber = userEmpNumber;
    }
    
    const issueRecords = await ppeRecordsCollection.find(query).sort({ dateOfIssue: -1 }).toArray();
    
    // Group by user and PPE to get latest issue for each combination
    const latestIssues = new Map();
    issueRecords.forEach(record => {
      const key = `${record.userEmpNumber}-${record.ppeId}`;
      if (!latestIssues.has(key)) {
        latestIssues.set(key, record);
      }
    });
    
    // Calculate due dates and filter overdue items
    const dueForReissue: PPEDueForReissue[] = [];
    const today = new Date();
    
    latestIssues.forEach(record => {
      const ppeMaster = ppeMasterRecords.find(p => p.ppeId === record.ppeId);
      if (!ppeMaster) return;
      
      // Calculate due date based on PPE life
      const issueDate = new Date(record.dateOfIssue);
      let dueDate = new Date(issueDate);
      
      switch (ppeMaster.lifeUOM) {
        case 'week':
          dueDate.setDate(issueDate.getDate() + (ppeMaster.life * 7));
          break;
        case 'month':
          dueDate.setMonth(issueDate.getMonth() + ppeMaster.life);
          break;
        case 'year':
          dueDate.setFullYear(issueDate.getFullYear() + ppeMaster.life);
          break;
      }
      
      // Check if due or overdue
      const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff >= daysOverdue) {
        dueForReissue.push({
          _id: record._id,
          userEmpNumber: record.userEmpNumber,
          userEmpName: record.userEmpName,
          ppeId: record.ppeId,
          ppeName: record.ppeName,
          lastIssueDate: issueDate,
          dueDate: dueDate,
          daysOverdue: daysDiff,
          quantity: record.quantityIssued
        });
      }
    });
    
    // Sort by days overdue (most overdue first)
    dueForReissue.sort((a, b) => b.daysOverdue - a.daysOverdue);
    
    const response: PPEApiResponse<PPEDueForReissue[]> = {
      success: true,
      data: dueForReissue
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching PPE due for reissue:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch PPE due for reissue' },
      { status: 500 }
    );
  }
}

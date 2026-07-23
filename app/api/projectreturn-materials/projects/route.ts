import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/auth';

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
    
    // Get distinct source projects from returned materials (excluding disposed)
    const projects = await db
      .collection('projreturnmaterials')
      .distinct('sourceProject', { disposed: { $ne: true } });

    // Sort projects alphabetically
    const sortedProjects = projects
      .filter((project): project is string => project != null && project.trim() !== '')
      .sort();

    return NextResponse.json(sortedProjects);
  } catch (err) {
    console.error('Failed to fetch projects from returned materials:', err);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}



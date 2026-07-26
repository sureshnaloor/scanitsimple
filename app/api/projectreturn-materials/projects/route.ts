import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { apiJson } from '@/lib/api-response';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiJson(
        { error: 'Unauthorized: sign in before using this feature' },
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

    return apiJson(sortedProjects);
  } catch (err) {
    console.error('Failed to fetch projects from returned materials:', err);
    return apiJson(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}



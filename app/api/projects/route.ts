import { connectToDatabase } from '@/lib/mongodb';
import { NextResponse, NextRequest } from 'next/server';
import { ObjectId, type Db } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { ensureLocationCitySeeds } from '@/lib/locationCitySeeds';

function normalizeName(value: unknown) {
  return String(value ?? '').trim();
}

async function resolveActiveEmployee(db: Db, empno: string) {
  const trimmed = empno.trim();
  if (!trimmed) return null;
  return db.collection('employees').findOne({
    empno: trimmed,
    active: { $ne: 'N' },
  });
}

async function isDepartmentLocationCityAllowed(db: Db, city: string): Promise<boolean> {
  await ensureLocationCitySeeds(db);
  const nk = city.trim().toLowerCase();
  const doc = await db.collection('locationcities').findOne({ kind: 'department', nameKey: nk });
  return !!doc;
}

function parseOptionalDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const projects = await db
      .collection('projects')
      .find({})
      .sort({ projectname: 1 })
      .toArray();

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectname,
      wbs,
      status,
      description,
      projectManagerEmpNo,
      department,
      locationCity,
      startDate: startDateRaw,
      endDate: endDateRaw,
    } = body;

    if (!projectname || !wbs) {
      return NextResponse.json(
        { error: 'Project name and WBS are required' },
        { status: 400 }
      );
    }

    const statusNorm = normalizeName(status);
    if (!statusNorm) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }
    const statusLo = statusNorm.toLowerCase();
    const allowed = new Set(['active', 'inactive', 'completed', 'pending']);
    if (!allowed.has(statusLo)) {
      return NextResponse.json(
        { error: 'Invalid status. Use active, inactive, completed, or pending.' },
        { status: 400 }
      );
    }

    const pmEmp = normalizeName(projectManagerEmpNo);
    const deptName = normalizeName(department);
    const city = normalizeName(locationCity);

    const { db } = await connectToDatabase();

    if (city) {
      if (!(await isDepartmentLocationCityAllowed(db, city))) {
        return NextResponse.json(
          { error: 'Invalid location city' },
          { status: 400 }
        );
      }
    }

    let manager: { empno: string; empname: string } | null = null;
    if (pmEmp) {
      const m = await resolveActiveEmployee(db, pmEmp);
      if (!m) {
        return NextResponse.json(
          { error: 'Project manager must be an active employee' },
          { status: 400 }
        );
      }
      manager = { empno: m.empno as string, empname: m.empname as string };
    }

    if (deptName) {
      const dept = await db.collection('departments').findOne({ name: deptName });
      if (!dept) {
        return NextResponse.json(
          { error: 'Department does not exist' },
          { status: 400 }
        );
      }
    }

    const startDate = parseOptionalDate(startDateRaw);
    const endDate = parseOptionalDate(endDateRaw);
    if (startDate === null && startDateRaw) {
      return NextResponse.json({ error: 'Invalid start date' }, { status: 400 });
    }
    if (endDate === null && endDateRaw) {
      return NextResponse.json({ error: 'Invalid end date' }, { status: 400 });
    }
    if (startDate && endDate && endDate < startDate) {
      return NextResponse.json(
        { error: 'End date cannot be before start date' },
        { status: 400 }
      );
    }

    const existing = await db.collection('projects').findOne({ wbs: normalizeName(wbs) });
    if (existing) {
      return NextResponse.json(
        { error: 'Project with this WBS already exists' },
        { status: 400 }
      );
    }

    const newProject = {
      projectname: normalizeName(projectname),
      wbs: normalizeName(wbs),
      status: statusLo,
      description: normalizeName(description) || '',
      projectManagerEmpNo: manager?.empno ?? null,
      projectManagerName: manager?.empname ?? null,
      department: deptName || '',
      locationCity: city || '',
      startDate: startDate ?? null,
      endDate: endDate ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('projects').insertOne(newProject);

    return NextResponse.json(
      { _id: result.insertedId, ...newProject },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      _id,
      projectname,
      wbs,
      status,
      description,
      projectManagerEmpNo,
      department,
      locationCity,
      startDate: startDateRaw,
      endDate: endDateRaw,
    } = body;

    if (!_id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (projectname !== undefined) updateData.projectname = projectname;
    if (wbs !== undefined) updateData.wbs = wbs;
    if (status !== undefined) updateData.status = status;
    if (description !== undefined) updateData.description = description;

    const pmRaw = projectManagerEmpNo;
    if (pmRaw !== undefined) {
      const pmEmp = normalizeName(pmRaw);
      if (!pmEmp) {
        updateData.projectManagerEmpNo = null;
        updateData.projectManagerName = null;
      } else {
        const manager = await resolveActiveEmployee(db, pmEmp);
        if (!manager) {
          return NextResponse.json(
            { error: 'Project manager must be an active employee' },
            { status: 400 }
          );
        }
        updateData.projectManagerEmpNo = manager.empno;
        updateData.projectManagerName = manager.empname;
      }
    }

    if (department !== undefined) {
      const deptName = normalizeName(department);
      if (!deptName) {
        updateData.department = '';
      } else {
        const dept = await db.collection('departments').findOne({ name: deptName });
        if (!dept) {
          return NextResponse.json(
            { error: 'Department does not exist' },
            { status: 400 }
          );
        }
        updateData.department = deptName;
      }
    }

    if (locationCity !== undefined) {
      const city = normalizeName(locationCity);
      if (!city) {
        updateData.locationCity = '';
      } else {
        if (!(await isDepartmentLocationCityAllowed(db, city))) {
          return NextResponse.json(
            { error: 'Invalid location city' },
            { status: 400 }
          );
        }
        updateData.locationCity = city;
      }
    }

    if (startDateRaw !== undefined) {
      const sd = parseOptionalDate(startDateRaw);
      if (sd === null && startDateRaw) {
        return NextResponse.json({ error: 'Invalid start date' }, { status: 400 });
      }
      updateData.startDate = sd ?? null;
    }
    if (endDateRaw !== undefined) {
      const ed = parseOptionalDate(endDateRaw);
      if (ed === null && endDateRaw) {
        return NextResponse.json({ error: 'Invalid end date' }, { status: 400 });
      }
      updateData.endDate = ed ?? null;
    }

    const current = await db.collection('projects').findOne({ _id: new ObjectId(_id) });
    if (!current) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (wbs !== undefined) {
      const w = normalizeName(wbs);
      if (w) {
        const dupWbs = await db.collection('projects').findOne({
          wbs: w,
          _id: { $ne: new ObjectId(_id) },
        });
        if (dupWbs) {
          return NextResponse.json(
            { error: 'Project with this WBS already exists' },
            { status: 400 }
          );
        }
      }
    }

    const mergedStart =
      updateData.startDate !== undefined ? (updateData.startDate as Date | null) : current.startDate;
    const mergedEnd =
      updateData.endDate !== undefined ? (updateData.endDate as Date | null) : current.endDate;
    if (mergedStart && mergedEnd && mergedEnd < mergedStart) {
      return NextResponse.json(
        { error: 'End date cannot be before start date' },
        { status: 400 }
      );
    }

    const result = await db.collection('projects').updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      _id,
      ...updateData,
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const result = await db.collection('projects').deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
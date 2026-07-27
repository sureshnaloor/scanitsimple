import { getServerSession } from 'next-auth/next';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { apiJson } from '@/lib/api-response';

const COLLECTION = 'customfielddefs';

const SCOPES = new Set(['master', 'basic', 'transaction']);
const INPUT_TYPES = new Set(['text', 'number', 'date', 'toggle', 'radio', 'master-select']);
const MASTER_SOURCE_VALUES = new Set([
  'fa-category',
  'mme-category',
  'fa-manufacturer',
  'mme-manufacturer',
  'departments',
  'designations',
  'location-cities',
]);

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiJson({ error: 'Unauthorized: sign in before using this feature' }, { status: 401 });
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(params.id);
    } catch {
      return apiJson({ error: 'Invalid field definition id' }, { status: 400 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {
      updatedby: session.user.name || session.user.email,
      updatedat: new Date(),
    };

    if (body?.scope !== undefined) {
      const scope = String(body.scope).trim();
      if (!SCOPES.has(scope)) return apiJson({ error: 'Invalid scope' }, { status: 400 });
      updates.scope = scope;
    }
    if (body?.entity !== undefined) {
      const entity = String(body.entity).trim();
      if (!entity) return apiJson({ error: 'Entity is required' }, { status: 400 });
      updates.entity = entity;
    }
    if (body?.label !== undefined) {
      const label = String(body.label).trim();
      if (!label) return apiJson({ error: 'Label is required' }, { status: 400 });
      updates.label = label;
    }
    if (body?.inputType !== undefined) {
      const inputType = String(body.inputType).trim();
      if (!INPUT_TYPES.has(inputType)) return apiJson({ error: 'Invalid input type' }, { status: 400 });
      updates.inputType = inputType;
    }
    if (body?.active !== undefined) {
      updates.active = Boolean(body.active);
    }

    const effectiveInputType = String(updates.inputType ?? body?.inputType ?? '');

    if (body?.masterSource !== undefined || effectiveInputType === 'master-select') {
      const masterSource = String(body?.masterSource ?? '').trim();
      const isValidSystemSource = MASTER_SOURCE_VALUES.has(masterSource);
      const isValidCustomSource = masterSource.startsWith('custom-');
      if (!isValidSystemSource && !isValidCustomSource) {
        return apiJson({ error: 'A valid master data source is required for dropdown fields' }, { status: 400 });
      }
      updates.masterSource = masterSource;
    }

    if (body?.options !== undefined || effectiveInputType === 'radio') {
      const options = Array.isArray(body?.options)
        ? body.options.map((o: unknown) => String(o).trim()).filter(Boolean)
        : [];
      if (options.length < 2) {
        return apiJson({ error: 'Radio fields need at least two options' }, { status: 400 });
      }
      updates.options = options;
    }

    const { db } = await connectToDatabase();
    const result = await db.collection(COLLECTION).findOneAndUpdate(
      { _id: objectId },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result) {
      return apiJson({ error: 'Field definition not found' }, { status: 404 });
    }
    return apiJson(result);
  } catch (error) {
    console.error('Failed to update custom field definition:', error);
    return apiJson({ error: 'Failed to update custom field definition' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(params.id);
    } catch {
      return apiJson({ error: 'Invalid field definition id' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const result = await db.collection(COLLECTION).deleteOne({ _id: objectId });
    if (result.deletedCount === 0) {
      return apiJson({ error: 'Field definition not found' }, { status: 404 });
    }
    return apiJson({ success: true });
  } catch (error) {
    console.error('Failed to delete custom field definition:', error);
    return apiJson({ error: 'Failed to delete custom field definition' }, { status: 500 });
  }
}

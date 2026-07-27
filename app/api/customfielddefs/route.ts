import { getServerSession } from 'next-auth/next';
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

function fieldKeyFromLabel(label: string): string {
  const cleaned = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned || 'field';
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const scope = url.searchParams.get('scope');
    const entity = url.searchParams.get('entity');

    const filter: Record<string, unknown> = {};
    if (scope && SCOPES.has(scope)) filter.scope = scope;
    if (entity) filter.entity = entity;

    const { db } = await connectToDatabase();
    const defs = await db
      .collection(COLLECTION)
      .find(filter)
      .sort({ entity: 1, createdat: 1 })
      .toArray();

    return apiJson(defs);
  } catch (error) {
    console.error('Failed to fetch custom field definitions:', error);
    return apiJson({ error: 'Failed to fetch custom field definitions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiJson({ error: 'Unauthorized: sign in before using this feature' }, { status: 401 });
    }

    const body = await request.json();
    const scope = String(body?.scope ?? '').trim();
    const entity = String(body?.entity ?? '').trim();
    const label = String(body?.label ?? '').trim();
    const inputType = String(body?.inputType ?? '').trim();

    if (!SCOPES.has(scope)) {
      return apiJson({ error: 'Invalid scope' }, { status: 400 });
    }
    if (!entity) {
      return apiJson({ error: 'Entity is required' }, { status: 400 });
    }
    if (!label) {
      return apiJson({ error: 'Label is required' }, { status: 400 });
    }
    if (!INPUT_TYPES.has(inputType)) {
      return apiJson({ error: 'Invalid input type' }, { status: 400 });
    }

    let masterSource: string | null = null;
    if (inputType === 'master-select') {
      masterSource = String(body?.masterSource ?? '').trim();
      const isValidSystemSource = MASTER_SOURCE_VALUES.has(masterSource);
      const isValidCustomSource = masterSource.startsWith('custom-');
      if (!isValidSystemSource && !isValidCustomSource) {
        return apiJson({ error: 'A valid master data source is required for dropdown fields' }, { status: 400 });
      }
    }

    let options: string[] = [];
    if (inputType === 'radio') {
      options = Array.isArray(body?.options)
        ? body.options.map((o: unknown) => String(o).trim()).filter(Boolean)
        : [];
      if (options.length < 2) {
        return apiJson({ error: 'Radio fields need at least two options' }, { status: 400 });
      }
    }

    const { db } = await connectToDatabase();

    const fieldKey = fieldKeyFromLabel(label);
    const duplicate = await db.collection(COLLECTION).findOne({ entity, fieldKey });
    if (duplicate) {
      return apiJson(
        { error: `A field with this label already exists for ${entity}` },
        { status: 409 }
      );
    }

    const doc = {
      scope,
      entity,
      label,
      fieldKey,
      inputType,
      masterSource,
      options,
      active: true,
      createdby: session.user.name || session.user.email,
      createdat: new Date(),
      updatedby: null as string | null,
      updatedat: null as Date | null,
    };

    const result = await db.collection(COLLECTION).insertOne(doc);
    const created = await db.collection(COLLECTION).findOne({ _id: result.insertedId });
    return apiJson(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create custom field definition:', error);
    return apiJson({ error: 'Failed to create custom field definition' }, { status: 500 });
  }
}

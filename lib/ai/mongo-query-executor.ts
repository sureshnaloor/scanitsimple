import { connectToDatabase } from '@/lib/mongodb';
import type { Db } from 'mongodb';

export const DATABASE_SCHEMA_PROMPT = `
You are connected to a MongoDB database for "SmartTags" Asset, MME, Tools, Materials, and PPE Management.

Here is the database schema, collections, and field definitions:

1. 'equipmentandtools' (MME - Measurement & Monitoring Equipment, and Tools):
   - assetnumber (string, starts with '5' or '9', e.g. "503159")
   - assetdescription (string, equipment name)
   - assetcategory (string, e.g. "PRESSURE", "ELECTRICAL", "SURVEY")
   - assetsubcategory (string)
   - assetstatus (string, e.g. "In Service", "Under Maintenance", "Disposed", "Damaged")
   - assetmanufacturer (string, e.g. "FLUKE", "DRUCK", "GE")
   - assetmodel (string)
   - assetserialnumber (string)
   - acquireddate (Date or ISO string)
   - acquiredvalue (number, in SAR)
   - legacyassetnumber (string)
   - assetnotes (string)
   - accessories (string)

2. 'fixedassets' (Fixed Assets - Transport, Portable, Facility, Software):
   - assetnumber (string, does NOT start with 5 or 9)
   - assetdescription (string)
   - assetcategory (string, e.g. "TRANSPORT", "PORTABLE", "FACILITY", "SOFTWARE")
   - assetsubcategory (string)
   - assetstatus (string)
   - assetmanufacturer (string)
   - assetmodel (string)
   - assetserialnumber (string)
   - acquireddate (Date)
   - acquiredvalue (number)
   - legacyassetnumber (string)
   - assetnotes (string)

3. 'equipmentcustody' (Custody movements for both MME and Fixed Assets):
   - assetnumber (string, matches equipmentandtools.assetnumber or fixedassets.assetnumber)
   - employeenumber (string, custodian employee number)
   - employeename (string, custodian name)
   - locationType (string: 'warehouse' | 'project_site' | 'camp/office' | 'department')
   - custodyCity / warehouseCity (string, e.g. "Dammam", "Riyadh", "Al-Khobar", "Jeddah")
   - project / projectname (string, project name or WBS)
   - premisesLabel / premisesId (string)
   - rackBinPallet (string)
   - shedRoomNumber (string)
   - containerNumberRack (string)
   - custodyfrom (Date or ISO string)
   - custodyto (Date or null. If null or missing, this is the CURRENT active custodian)
   - documentnumber (string, gatepass/transfer doc number)
   - custodyRemark (string)

4. 'equipmentcalibcertificates' (Calibration certificates & history for MME):
   - assetnumber (string)
   - calibrationRequired (string: 'Required' | 'Not Required')
   - calibratedby (string, calibration company name)
   - calibrationdate (Date)
   - calibrationtodate (Date, valid till / expiration date)
   - calibrationpo (string, purchase order)
   - calibcertificate / calibfile (string, certificate reference)
   - idlePeriodFrom (Date, optional)
   - idlePeriodTo (Date, optional)

5. 'ppe-records' (PPE issue records to employees):
   - userEmpNumber (string)
   - userEmpName (string)
   - dateOfIssue (Date)
   - ppeId (string, e.g. "PPE-001")
   - ppeName (string, e.g. "FRC Coverall", "Safety Helmet", "Safety Shoes")
   - quantityIssued (number)
   - size (string, e.g. "M", "L", "XL", "42")
   - isFirstIssue (boolean)
   - issueAgainstDue (boolean)
   - reservationNumber (string)
   - fileReferenceNumber (string)
   - remarks (string)
   - issuedBy (string)
   - issuedByName (string)

6. 'ppe-bulk-issues' (Bulk PPE issues to projects/departments):
   - departmentOrProjectName (string)
   - location (string)
   - ppeId (string)
   - ppeName (string)
   - quantityIssued (number)
   - receiverUserEmpNumber (string)
   - receiverUserEmpName (string)
   - issueDate (Date)
   - issuedByName (string)

7. 'ppe-master' (PPE item master catalog):
   - ppeId (string)
   - ppeName (string)
   - materialCode (string)
   - life (number)
   - lifeUOM (string: 'week' | 'month' | 'year')
   - category (string)
   - isActive (boolean)

8. 'employees' (Employee master directory):
   - empno (string)
   - empname (string)
   - email (string)
   - department (string)
   - designation (string)
   - location (string)
   - active (string, 'Y' or 'N')

9. 'projects' (Project master directory):
   - wbs (string)
   - projectname (string)
   - projectManagerEmpNo (string)
   - projectManagerName (string)
   - department (string)
   - locationCity (string)

10. 'locationcities' (Master list of cities and locations):
    - name (string)
    - kind (string: 'warehouse' | 'department')
`;

import { ObjectId } from 'mongodb';

export interface SafeQueryPlan {
  collection: string;
  operation: 'aggregate' | 'find' | 'countDocuments' | 'distinct';
  pipeline?: any[];
  filter?: Record<string, any>;
  projection?: Record<string, any>;
  sort?: Record<string, any>;
  limit?: number;
  distinctField?: string;
}

const FORBIDDEN_AGG_STAGES = new Set([
  '$out',
  '$merge',
  '$collStats',
  '$indexStats',
  '$planCacheStats',
]);

const ALLOWED_COLLECTIONS = new Set([
  'equipmentandtools',
  'fixedassets',
  'equipmentcustody',
  'equipmentcalibcertificates',
  'ppe-records',
  'ppe-bulk-issues',
  'ppe-master',
  'ppe-stock-balance',
  'ppe-transactions',
  'employees',
  'projects',
  'locationcities',
  'categories',
  'manufacturers',
  'subcategories',
  'departments',
  'locations',
  'ai-agent-knowledge',
]);

export function validateQuerySafety(plan: SafeQueryPlan): void {
  if (!plan.collection || !ALLOWED_COLLECTIONS.has(plan.collection)) {
    throw new Error(`Invalid or unauthorized collection: "${plan.collection}"`);
  }

  if (plan.operation === 'aggregate') {
    if (!Array.isArray(plan.pipeline)) {
      throw new Error('Aggregation pipeline must be an array');
    }

    for (const stage of plan.pipeline) {
      if (typeof stage !== 'object' || stage === null) {
        throw new Error('Invalid stage in aggregation pipeline');
      }
      for (const key of Object.keys(stage)) {
        if (FORBIDDEN_AGG_STAGES.has(key)) {
          throw new Error(`Forbidden aggregation stage detected: ${key}`);
        }
      }
    }
  } else if (!['find', 'countDocuments', 'distinct'].includes(plan.operation)) {
    throw new Error(`Forbidden operation: "${plan.operation}". Only read operations are permitted.`);
  }
}

/**
 * Recursively converts ISO date strings (and $date / $oid objects) to proper BSON Date / ObjectId instances.
 * This ensures MongoDB date queries match ISODate stored values.
 */
export function deserializeBsonTypes(val: any): any {
  if (val === null || val === undefined) return val;

  // Handle ISO date strings (e.g. "2026-01-01T00:00:00.000Z" or "2026-01-01")
  if (typeof val === 'string') {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z?)?$/;
    if (isoDateRegex.test(val)) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d;
      }
    }
    return val;
  }

  if (Array.isArray(val)) {
    return val.map(deserializeBsonTypes);
  }

  if (typeof val === 'object') {
    // Handle explicit MongoDB extended JSON syntax
    if (val.$date) {
      const d = new Date(
        typeof val.$date === 'string'
          ? val.$date
          : val.$date.$numberLong
          ? Number(val.$date.$numberLong)
          : val.$date
      );
      if (!isNaN(d.getTime())) return d;
    }
    if (val.$oid && typeof val.$oid === 'string' && ObjectId.isValid(val.$oid)) {
      return new ObjectId(val.$oid);
    }

    const res: Record<string, any> = {};
    for (const key of Object.keys(val)) {
      res[key] = deserializeBsonTypes(val[key]);
    }
    return res;
  }

  return val;
}

export async function executeSafeMongoQuery(plan: SafeQueryPlan): Promise<any> {
  validateQuerySafety(plan);

  const { db } = await connectToDatabase();
  const collection = db.collection(plan.collection);

  const maxLimit = plan.limit ? Math.min(plan.limit, 1000) : 500;

  if (plan.operation === 'aggregate') {
    const rawPipeline = Array.isArray(plan.pipeline) ? plan.pipeline : [];
    const pipeline = deserializeBsonTypes(rawPipeline);

    // Ensure pipeline ends with a limit if not group-aggregating to single number
    const hasLimit = pipeline.some((s: any) => typeof s === 'object' && s !== null && '$limit' in s);
    if (!hasLimit) {
      pipeline.push({ $limit: maxLimit });
    }
    return await collection.aggregate(pipeline).toArray();
  }

  if (plan.operation === 'find') {
    const filter = deserializeBsonTypes(plan.filter || {});
    let cursor = collection.find(filter);
    if (plan.projection) {
      cursor = cursor.project(plan.projection);
    }
    if (plan.sort) {
      cursor = cursor.sort(plan.sort);
    }
    return await cursor.limit(maxLimit).toArray();
  }

  if (plan.operation === 'countDocuments') {
    const filter = deserializeBsonTypes(plan.filter || {});
    return await collection.countDocuments(filter);
  }

  if (plan.operation === 'distinct' && plan.distinctField) {
    const filter = deserializeBsonTypes(plan.filter || {});
    return await collection.distinct(plan.distinctField, filter);
  }

  throw new Error(`Unsupported operation: ${plan.operation}`);
}

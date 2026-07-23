const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvFile(path.join(process.cwd(), '.env.local'));

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;

  if (!uri || !dbName) {
    throw new Error('Missing MONGODB_URI or MONGODB_DB. Set env vars or .env.local values.');
  }

  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db(dbName);
    const collection = db.collection('equipmentcalibcertificates');

    const filterMissingRequired = {
      $or: [
        { calibrationRequired: { $exists: false } },
        { calibrationRequired: null },
        { calibrationRequired: '' }
      ]
    };

    const setRequiredResult = await collection.updateMany(filterMissingRequired, {
      $set: { calibrationRequired: 'Required' }
    });

    const clearIdleDurationForNotRequired = await collection.updateMany(
      { calibrationRequired: 'Not Required', idleCalibrationDuration: { $exists: false } },
      { $set: { idleCalibrationDuration: '' } }
    );

    console.log('Backfill complete');
    console.log(`- calibrationRequired set to "Required": ${setRequiredResult.modifiedCount}`);
    console.log(`- idleCalibrationDuration initialized for "Not Required": ${clearIdleDurationForNotRequired.modifiedCount}`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});

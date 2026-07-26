import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

if (!process.env.MONGODB_DB) {
  throw new Error('Please add your Mongo Database to .env.local');
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

// Use Node's global object to persist the connection across Next.js Hot Module Replacement (HMR)
interface GlobalMongo {
  _mongoClient?: MongoClient;
  _mongoDb?: Db;
}

const globalMongo = global as typeof globalThis & GlobalMongo;

export async function connectToDatabase() {
  if (globalMongo._mongoClient && globalMongo._mongoDb) {
    return {
      client: globalMongo._mongoClient,
      db: globalMongo._mongoDb,
    };
  }

  // Set connection pool options to prevent leakage
  const client = new MongoClient(uri, {
    maxPoolSize: 10, // limit connections per server instance
    minPoolSize: 2,
    maxIdleTimeMS: 30000, // close idle connections after 30 seconds
  });

  await client.connect();
  const db = client.db(dbName);

  globalMongo._mongoClient = client;
  globalMongo._mongoDb = db;

  return {
    client,
    db,
  };
}

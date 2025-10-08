// src/lib/mongodb.ts - OPTIMIZED FOR VERCEL SERVERLESS
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MONGODB_URI to .env.local or environment variables');
}

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'skill_sculptor';

// Global variable to cache the connection across serverless function invocations
interface CachedConnection {
  client: MongoClient | null;
  db: Db | null;
  promise: Promise<MongoClient> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoConnection: CachedConnection | undefined;
}

const cached: CachedConnection = global.mongoConnection || {
  client: null,
  db: null,
  promise: null,
};

if (!global.mongoConnection) {
  global.mongoConnection = cached;
}

/**
 * Connect to MongoDB with connection caching for serverless
 * @returns MongoClient instance
 */
export async function connectToDatabase(): Promise<MongoClient> {
  // Return cached client if available
  if (cached.client && cached.client.topology?.isConnected()) {
    console.log('✅ Using cached MongoDB connection');
    return cached.client;
  }

  // If connection promise exists, wait for it
  if (cached.promise) {
    console.log('⏳ Waiting for existing MongoDB connection...');
    cached.client = await cached.promise;
    return cached.client;
  }

  // Create new connection
  console.log('🔌 Creating new MongoDB connection...');
  
  const options = {
    maxPoolSize: 10, // Limit connection pool size
    minPoolSize: 2,
    maxIdleTimeMS: 60000, // Close idle connections after 60s
    serverSelectionTimeoutMS: 5000, // Timeout after 5s
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4, skip trying IPv6
  };

  try {
    cached.promise = MongoClient.connect(MONGODB_URI, options);
    cached.client = await cached.promise;
    
    // Test connection
    await cached.client.db(MONGODB_DB_NAME).command({ ping: 1 });
    console.log('✅ MongoDB connected successfully');
    
    return cached.client;
  } catch (error) {
    cached.promise = null;
    cached.client = null;
    console.error('❌ MongoDB connection failed:', error);
    throw new Error('Failed to connect to database');
  }
}

/**
 * Get database instance
 */
export async function getDatabase(): Promise<Db> {
  if (cached.db) {
    return cached.db;
  }

  const client = await connectToDatabase();
  cached.db = client.db(MONGODB_DB_NAME);
  return cached.db;
}

/**
 * Get users collection
 */
export async function getUsersCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection('users');
}

/**
 * Get skills collection
 */
export async function getSkillsCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection('skills');
}

/**
 * Get learning plans collection
 */
export async function getLearningPlansCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection('learning_plans');
}

/**
 * Graceful shutdown - cleanup connections
 * Note: In serverless, this might not always be called
 */
export async function closeDatabaseConnection(): Promise<void> {
  if (cached.client) {
    await cached.client.close();
    cached.client = null;
    cached.db = null;
    cached.promise = null;
    console.log('🔌 MongoDB connection closed');
  }
}

// Export ObjectId for convenience
export { ObjectId };

// Health check function for monitoring
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const client = await connectToDatabase();
    await client.db(MONGODB_DB_NAME).command({ ping: 1 });
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
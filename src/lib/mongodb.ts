// @ts-nocheck
import { MongoClient, Db, Collection } from 'mongodb';

// Завдяки глобальній змінній ми уникаємо лімітів з'єднань
// під час частих перезапусків Serverless функцій (наприклад, на Vercel).
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'skill_sculptor';

if (!MONGODB_URI && process.env.NODE_ENV !== 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
  // We don't throw during build to allow Next.js static collection to pass
  console.warn('MONGODB_URI is not defined');
}

// Клеш для збереження об'єкту підключення
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Оптимізації для пулу підключень
  const opts = {
    maxPoolSize: 10,           // Обмеження кількості з'єднань у пулі (ідеально для серверлес)
    serverSelectionTimeoutMS: 5000, 
    socketTimeoutMS: 45000,
  };

  const client = new MongoClient(MONGODB_URI, opts);

  await client.connect();
  const db = client.db(MONGODB_DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function getDatabase(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}

export async function getUsersCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection('users');
}

export async function getSkillsCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection('skills');
}

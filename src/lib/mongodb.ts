import { MongoClient, Db, Collection } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

// Database helper functions
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db('skill_sculptor');
}

export async function getUsersCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection('users');
}

export async function getSkillsCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection('skills');
}

export async function getSkillGoalsCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection('skill_goals');
}

export async function getSkillProgressCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection('skill_progress');
}

export async function getSkillCategoriesCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection('skill_categories');
}

export async function getFilesCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection('files');
}

// Initialize collections with indexes
export async function initializeDatabase() {
  const db = await getDatabase();
  
  // Create indexes for better performance
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('skills').createIndex({ userId: 1 });
  await db.collection('skills').createIndex({ category: 1 });
  await db.collection('skill_goals').createIndex({ skillId: 1 });
  await db.collection('skill_progress').createIndex({ skillId: 1 });
  await db.collection('skill_progress').createIndex({ loggedAt: -1 });
  await db.collection('files').createIndex({ userId: 1 });
  await db.collection('files').createIndex({ skillId: 1 });
  
  // Insert default skill categories if they don't exist
  const categoriesCollection = await getSkillCategoriesCollection();
  const existingCategories = await categoriesCollection.countDocuments();
  
  if (existingCategories === 0) {
    await categoriesCollection.insertMany([
      { name: 'Програмування', description: 'Навички розробки та програмування', color: '#3B82F6', icon: 'code', createdAt: new Date() },
      { name: 'Дизайн', description: 'Графічний та UI/UX дизайн', color: '#EF4444', icon: 'palette', createdAt: new Date() },
      { name: 'Мови', description: 'Вивчення іноземних мов', color: '#10B981', icon: 'globe', createdAt: new Date() },
      { name: 'Музика', description: 'Музичні інструменти та теорія музики', color: '#8B5CF6', icon: 'music', createdAt: new Date() },
      { name: 'Спорт', description: 'Фізичні навички та спорт', color: '#F59E0B', icon: 'activity', createdAt: new Date() },
      { name: 'Бізнес', description: 'Підприємництво та управління', color: '#6B7280', icon: 'briefcase', createdAt: new Date() },
      { name: 'Наука', description: 'Наукові дисципліни та дослідження', color: '#059669', icon: 'beaker', createdAt: new Date() },
      { name: 'Мистецтво', description: 'Творчі та художні навички', color: '#DC2626', icon: 'brush', createdAt: new Date() }
    ]);
  }
}
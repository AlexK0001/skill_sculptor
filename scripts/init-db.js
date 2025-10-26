const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const dbName = 'skill_sculptor';

async function initializeDatabase() {
  if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);

    // Create collections if they don't exist
    const collections = ['users', 'skills', 'skill_goals', 'skill_progress', 'skill_categories', 'files', 'learning_plans'];
    
    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        console.log(`Created collection: ${collectionName}`);
      } catch (error) {
        if (error.codeName === 'NamespaceExists') {
          console.log(`Collection ${collectionName} already exists`);
        } else {
          console.error(`Error creating collection ${collectionName}:`, error.message);
        }
      }
    }

    // Create indexes for better performance
    console.log('Creating indexes...');

    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('skills').createIndex({ userId: 1 });
    await db.collection('skills').createIndex({ category: 1 });
    await db.collection('skill_goals').createIndex({ skillId: 1 });
    await db.collection('skill_progress').createIndex({ skillId: 1 });
    await db.collection('skill_progress').createIndex({ loggedAt: -1 });
    await db.collection('files').createIndex({ userId: 1 });
    await db.collection('files').createIndex({ skillId: 1 });
    await db.collection('learning_plans').createIndex({ userId: 1 });
    await db.collection('learning_plans').createIndex({ createdAt: -1 });
    await db.collection('user_progress').createIndex({ userId: 1 }, { unique: true });
    await db.collection('user_progress').createIndex({ lastCheckinDate: -1 });
    await db.collection('user_progress').createIndex({ updatedAt: -1 });

    console.log('Indexes created successfully');

    console.log('Database initialization completed successfully!');
    
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the initialization
finaly (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
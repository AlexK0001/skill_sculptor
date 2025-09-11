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

    console.log('Indexes created successfully');

    // Insert default skill categories if they don't exist
    const categoriesCollection = db.collection('skill_categories');
    const existingCategories = await categoriesCollection.countDocuments();
    
    if (existingCategories === 0) {
      console.log('Inserting default skill categories...');
      
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
      
      console.log('Default skill categories inserted');
    } else {
      console.log('Skill categories already exist');
    }

    console.log('Database initialization completed successfully!');
    
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the initialization
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
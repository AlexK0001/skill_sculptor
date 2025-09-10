// scripts/init-db.js
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function initializeDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/skill_sculptor';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('skill_sculptor');

    // Create indexes
    console.log('Creating indexes...');
    
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('skills').createIndex({ userId: 1 });
    await db.collection('skills').createIndex({ category: 1 });
    await db.collection('skill_goals').createIndex({ skillId: 1 });
    await db.collection('skill_progress').createIndex({ skillId: 1 });
    await db.collection('skill_progress').createIndex({ loggedAt: -1 });
    await db.collection('files').createIndex({ userId: 1 });
    await db.collection('files').createIndex({ skillId: 1 });

    console.log('Indexes created successfully');

    // Insert default skill categories
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

      console.log('Default categories inserted successfully');
    } else {
      console.log('Categories already exist, skipping...');
    }

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await client.close();
  }
}

initializeDatabase();
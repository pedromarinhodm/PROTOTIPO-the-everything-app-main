const mongoose = require('mongoose');

async function listCollections() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/controle_estoque';

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:');
    collections.forEach(col => console.log(`- ${col.name}`));

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listCollections();

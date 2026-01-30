const mongoose = require('mongoose');

async function inspectCollections() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/controle_estoque';

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });

    const db = mongoose.connection.db;
    const collections = ['produtos', 'movimentacaos', 'formularios_meta'];

    for (const collectionName of collections) {
      console.log(`\n=== ${collectionName.toUpperCase()} ===`);
      const collection = db.collection(collectionName);
      const count = await collection.countDocuments();
      console.log(`Total documents: ${count}`);

      if (count > 0) {
        const sample = await collection.find().limit(3).toArray();
        console.log('Sample documents:');
        sample.forEach((doc, index) => {
          console.log(`Document ${index + 1}:`, JSON.stringify(doc, null, 2));
        });
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

inspectCollections();

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const uri = process.env.MONGO_URI;

(async () => {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const adminDb = client.db().admin();
    const { databases } = await adminDb.listDatabases();
    console.log('Databases:');
    for (const db of databases) {
      console.log(`- ${db.name}`);
      const collections = await client.db(db.name).listCollections().toArray();
      for (const coll of collections) {
        const count = await client.db(db.name).collection(coll.name).countDocuments();
        console.log(`   * ${coll.name} (${count})`);
      }
    }
  } catch (err) {
    console.error('error', err);
  } finally {
    await client.close();
  }
})();

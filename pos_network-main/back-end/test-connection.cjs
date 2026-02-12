const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const uri = process.env.MONGO_URI;
console.log('Connecting to', uri);
(async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected successfully');
  } catch (err) {
    console.error('Connection error:', err.message);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();

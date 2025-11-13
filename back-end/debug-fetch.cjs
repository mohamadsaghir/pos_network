const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const debtSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    boxName: String,
    date: String,
    amount: Number,
    note: String,
    paid: Boolean,
  },
  { timestamps: true }
);

const Debt = mongoose.model('Debt', debtSchema, 'debts');

dotenv.config({ path: path.join(__dirname, '.env') });
const uri = process.env.MONGO_URI;

(async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, dbName: process.env.MONGO_DB_NAME || 'payflow' });
    const docs = await Debt.find();
    console.log('count', docs.length);
    console.log(JSON.stringify(docs.slice(0, 5), null, 2));
  } catch (err) {
    console.error('error', err);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();

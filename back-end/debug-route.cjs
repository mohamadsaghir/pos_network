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

const ym = (d) => d.getFullYear() * 12 + d.getMonth();

async function rolloverPaidIfMonthChanged() {
  const paidDocs = await Debt.find({ paid: true });
  const now = new Date();
  const nowYM = ym(now);
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const firstOfMonth = `${yyyy}-${mm}-01`;

  const tasks = [];
  for (const doc of paidDocs) {
    let base = new Date(doc.date);
    if (!(base instanceof Date) || isNaN(base) || base.getFullYear() < 2000) {
      base = new Date(doc.createdAt);
    }
    if (!isNaN(base) && ym(base) < nowYM) {
      tasks.push(Debt.findByIdAndUpdate(doc._id, { paid: false, date: firstOfMonth }, { new: false }));
    }
  }
  if (tasks.length) await Promise.all(tasks);
}

dotenv.config({ path: path.join(__dirname, '.env') });
const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME?.trim() || 'payflow';

(async () => {
  try {
    await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 5000 });
    await rolloverPaidIfMonthChanged();
    const debts = await Debt.find().sort({ createdAt: -1 });
    console.log('raw count', debts.length);
    const now = new Date();
    const nowYM = now.getFullYear() * 12 + now.getMonth();
    const adjusted = debts.map((doc) => {
      const d = doc.toObject();
      d.monthsDue = 1;
      if (typeof d.amount === 'number') {
        let base = new Date(d.date);
        if (!(base instanceof Date) || isNaN(base) || base.getFullYear() < 2000) {
          base = new Date(d.createdAt);
        }
        if (!isNaN(base)) {
          const baseYM = base.getFullYear() * 12 + base.getMonth();
          let monthsBehind = nowYM - baseYM;
          if (monthsBehind < 0) monthsBehind = 0;
          const multiplier = monthsBehind + 1;
          d.monthsDue = multiplier;
          if (d.paid !== true) {
            d.amount = Math.max(0, d.amount * multiplier);
          }
        }
      }
      return d;
    });
    console.log(JSON.stringify(adjusted, null, 2));
  } catch (err) {
    console.error('error', err);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();

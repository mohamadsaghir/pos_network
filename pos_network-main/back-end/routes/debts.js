import express from "express";
import Debt from "../models/Debt.js";

const router = express.Router();

// Helper: convert Date to year-month index
const ym = (d) => d.getFullYear() * 12 + d.getMonth();

// ✅ Monthly rollover: if someone was paid last month, mark unpaid for new month
async function rolloverPaidIfMonthChanged() {
  try {
    const paidDocs = await Debt.find({ paid: true });
    const now = new Date();
    const nowYM = ym(now);
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const firstOfMonth = `${yyyy}-${mm}-01`;

    const tasks = [];
    for (const doc of paidDocs) {
      let base = new Date(doc.date);
      if (!(base instanceof Date) || isNaN(base) || base.getFullYear() < 2000) {
        base = new Date(doc.createdAt);
      }
      if (!isNaN(base) && ym(base) < nowYM) {
        tasks.push(
          Debt.findByIdAndUpdate(doc._id, { paid: false, date: firstOfMonth }, { new: false })
        );
      }
    }
    if (tasks.length) await Promise.all(tasks);
  } catch (e) {
    // Log and continue without failing the request
    console.error("⚠️ Rollover check failed:", e?.message || e);
  }
}

// ✅ Get all debts
router.get("/", async (req, res) => {
  try {
    await rolloverPaidIfMonthChanged();
    const debts = await Debt.find().sort({ createdAt: -1 });
    console.log("GET /api/debts -> raw count", debts.length);
    const now = new Date();
    const nowYM = now.getFullYear() * 12 + now.getMonth();

    const adjusted = debts.map((doc) => {
      const d = doc.toObject();
      // default monthsDue to 1 for current month
      d.monthsDue = 1;
      if (typeof d.amount === "number") {
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

    res.status(200).json(adjusted);
  } catch (err) {
    console.error("❌ Error fetching debts:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Unpaid with carryover: people who now owe 2+ months
router.get("/unpaid-carryover", async (req, res) => {
  try {
    await rolloverPaidIfMonthChanged();
    const debts = await Debt.find().sort({ createdAt: -1 });
    const now = new Date();
    const nowYM = now.getFullYear() * 12 + now.getMonth();

    const adjusted = debts.map((doc) => {
      const d = doc.toObject();
      d.monthsDue = 1;
      if (typeof d.amount === "number") {
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

    const result = adjusted.filter((d) => d.paid !== true && d.monthsDue >= 2);
    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Error fetching unpaid carryover:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Add new debt
router.post("/", async (req, res) => {
  try {
    const { name, phone, boxName, amount, date } = req.body;

    if (!name || !phone || !amount || !boxName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const today = new Date().toISOString().split("T")[0];
    const newDebt = new Debt({
      name,
      phone,
      boxName,
      amount,
      date: date || today,
      paid: false,
    });

    await newDebt.save();
    res.status(201).json(newDebt);
  } catch (err) {
    console.error("❌ Error adding debt:", err.message);
    res.status(400).json({ message: err.message });
  }
});

// ✅ Update debt
router.put("/:id", async (req, res) => {
  try {
    const updated = await Debt.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Debt not found" });
    res.status(200).json(updated);
  } catch (err) {
    console.error("❌ Error updating debt:", err.message);
    res.status(400).json({ message: err.message });
  }
});

// ✅ Delete debt
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Debt.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Debt not found" });
    res.status(200).json({ message: "Debt deleted" });
  } catch (err) {
    console.error("❌ Error deleting debt:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// (rollover route removed)

export default router;

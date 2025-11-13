import mongoose from "mongoose";

const debtSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    boxName: { type: String, required: true },
    date: { type: String, required: true },
    amount: { type: Number, required: true },
    note: { type: String },
    paid: { type: Boolean, default: false },
  },
  { timestamps: true } // 👈 حتى يشتغل sort({ createdAt: -1 })
);

export default mongoose.model("Debt", debtSchema);

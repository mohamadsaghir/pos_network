import React, { useState, useEffect, useRef } from "react";
import "../styles/Home.css";
import TablePage from "./TablePage";
import { createDebt, updateDebt } from "../utils/debtsService";

function Home({ editPerson, setEditPerson }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    boxName: "",
    amount: "",
    date: "",
  });

  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const tableRef = useRef(); // 👈 مرجع للجدول لاستدعاء التحديث لاحقاً

  

  useEffect(() => {
    if (editPerson) {
      setFormData({
        name: editPerson.name,
        phone: editPerson.phone,
        boxName: editPerson.boxName,
        amount: editPerson.amount,
        date: editPerson.date,
      });
      setEditId(editPerson._id);
      setTimeout(() => setEditPerson(null), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editPerson]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (editId) {
        const result = await updateDebt(editId, formData);
        if (result.queued) {
          alert("⚠️ لا يوجد إنترنت. تم حفظ التعديل محليًا وسيُرسل تلقائيًا لاحقًا.");
        } else {
          alert("✅ تم تعديل الزبون بنجاح!");
        }
        setEditId(null);
      } else {
        const result = await createDebt(formData);
        if (result.queued) {
          alert("⚠️ لا يوجد إنترنت. تم حفظ الزبون محليًا وسيُرسل تلقائيًا لاحقًا.");
        } else {
          alert("✅ تمت إضافة الزبون بنجاح!");
        }
      }

      // 🔄 تحديث الجدول مباشرة بعد الحفظ
      if (tableRef.current) {
        tableRef.current.refreshTable();
      }

      // تصفير الحقول
      setFormData({
        name: "",
        phone: "",
        boxName: "",
        amount: "",
        date: "",
      });
    } catch (err) {
      console.error("Error saving data:", err);
      alert("❌ حدث خطأ أثناء الحفظ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="home-container">
      <div className="form-glass">
        <h2>{editId ? "✏️ تعديل الزبون" : "🧾 إضافة زبون جديد"}</h2>

        <form className="glass-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="اسم الزبون"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="رقم الهاتف"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="boxName"
            placeholder="اسم العلبة"
            value={formData.boxName}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="amount"
            placeholder="المبلغ $"
            value={formData.amount}
            onChange={handleChange}
            required
          />
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />

          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting
              ? "⏳ جاري الحفظ..."
              : editId
              ? "💾 حفظ التعديل"
              : "➕ إضافة"}
          </button>
        </form>
      </div>

      {/* ✅ تمرير المرجع للجدول */}
      <TablePage setEditPerson={setEditPerson} ref={tableRef} />
    </div>
  );
}

export default Home;

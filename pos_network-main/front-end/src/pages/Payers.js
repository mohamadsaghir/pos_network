import React, { useEffect, useState } from "react";
import "../styles/TablePage.css";
import {
  fetchDebtsList,
  deleteDebt,
} from "../utils/debtsService";

function Payers() {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [usingCache, setUsingCache] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 📦 تحميل الأشخاص الذين دفعوا فقط
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await fetchDebtsList();
      const paidUsers = result.data.filter((item) => item.paid);
      setData(paidUsers);
      setUsingCache(result.source === "cache");
    } catch (err) {
      console.error("Error fetching data:", err);
      setUsingCache(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 💬 إرسال رسالة واتساب
  const handleSendWhatsApp = (person) => {
    const message = `مرحبًا ${person.name} ، شكرًا لتسديدك المبلغ (${person.amount}$) للعلبة ${person.boxName} `;
    const url = `https://wa.me/${person.phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // 🗑️ حذف زبون
  const handleDelete = async (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الزبون؟")) {
      try {
        setData((prev) => prev.filter((item) => item._id !== id));
        const result = await deleteDebt(id);
        if (result.queued) {
          alert("⚠️ لا يوجد إنترنت. تم حفظ الحذف محليًا وسيُرسل تلقائيًا لاحقًا.");
        }
        await fetchData();
      } catch (err) {
        console.error("Error deleting data:", err);
      }
    }
  };

  // 🔎 فلترة حسب البحث
  const filteredData = data.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone?.includes(searchTerm) ||
      item.boxName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="products-table-container">
      <h3>✅ الدافعون</h3>

      <input
        type="text"
        className="search-input responsive"
        placeholder="🔍 ابحث بالاسم أو الرقم أو العلبة..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {usingCache && (
        <p className="offline-indicator">
          البيانات المعروضة من الذاكرة المؤقتة بسبب انقطاع الإنترنت.
        </p>
      )}

      {isLoading && (
        <div className="loading-indicator" role="status">
          <span className="spinner" aria-hidden="true" />
          <span>جاري تحميل البيانات...</span>
        </div>
      )}

      {!isLoading && filteredData.length === 0 ? (
        <p className="no-products">ما في حدا دافع بعد 💸</p>
      ) : (
        <table className="products-table">
          <tbody>
            {filteredData.map((person) => (
              <tr key={person._id} className="paid-row">
                <td><strong> الاسم:</strong> {person.name || "—"}</td>
                <td><strong> الهاتف:</strong> {person.phone || "—"}</td>
                <td><strong> العلبة:</strong> {person.boxName || "—"}</td>
                <td><strong> المبلغ:</strong> <span className="product-price">{person.amount ? `$${person.amount}` : "—"}</span></td>

                <td>
                  <span className="product-status available">✅ تم التسديد</span>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="view-btn" onClick={() => handleSendWhatsApp(person)}>
                      💬 WhatsApp
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(person._id)}>
                      🗑️ حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Payers;

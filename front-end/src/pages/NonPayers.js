import React, { useEffect, useState } from "react";
import "../styles/TablePage.css";
import { fetchDebtsList, updateDebt, deleteDebt } from "../utils/debtsService";

function NonPayers() {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [usingCache, setUsingCache] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // 🧩 تحميل الأشخاص غير المدفوعين فقط
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await fetchDebtsList();
      const unpaidUsers = result.data.filter((item) => !item.paid);
      setData(unpaidUsers);
      setUsingCache(result.source === "cache");
    } catch (err) {
      console.error("Error fetching data:", err);
      setUsingCache(false);
    } finally {
      setIsLoading(false);
    }
  };

  const openWhatsApp = (phone, message) => {
    if (!phone) {
      alert("رقم الهاتف غير متوفر.");
      return;
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // 💬 إرسال تذكير واتساب
  const handleSendReminder = async (person) => {
    const message = `مرحبًا ${person.name} ، نذكّرك أن المبلغ المستحق (${person.amount}$) لم يتم دفعه بعد. يرجى التجديد في أقرب وقت `;
    openWhatsApp(person.phone, message);
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

  // 💰 تسديد المبلغ
  const handleMarkPaid = async (person) => {
    try {
      const updatedPerson = { ...person, paid: true };
      setData((prev) => prev.filter((item) => item._id !== person._id));
      const result = await updateDebt(person._id, updatedPerson);
      if (result.queued) {
        alert("⚠️ لا يوجد إنترنت. تم حفظ التعديل محليًا وسيُرسل تلقائيًا لاحقًا.");
      } else {
        alert(`✅ ${person.name} تم تحويله إلى قائمة الدافعين`);
        const message = `مرحبًا ${person.name}، تم تسديد فاتورتك بنجاح \nشكرًا لتسديدك `;
        openWhatsApp(person.phone, message);
      }
      await fetchData();
    } catch (err) {
      console.error("Error marking as paid:", err);
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
      <h3>❌ الغير دافعين</h3>

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
        <p className="no-products">🎉 كل الناس دفعوا! ما في ديون 😎</p>
      ) : (
        <table className="products-table">
          <tbody>
            {filteredData.map((person) => (
              <tr key={person._id} className="unpaid-row">
                <td><strong> الاسم:</strong> {person.name || "—"}</td>
                <td><strong> الهاتف:</strong> {person.phone || "—"}</td>
                <td><strong> العلبة:</strong> {person.boxName || "—"}</td>
                <td><strong>💵 المبلغ:</strong> <span className="product-price">{person.amount ? `$${person.amount}` : "—"}</span></td>

                <td>
                  <span className="product-status out-of-stock">❌ غير مدفوع</span>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="view-btn" onClick={() => handleMarkPaid(person)}>💰 تسديد</button>
                    <button
                      className="view-btn"
                      onClick={() => handleSendReminder(person)}
                    >
                      💬 WhatsApp
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(person._id)}>🗑️ حذف</button>
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

export default NonPayers;
              

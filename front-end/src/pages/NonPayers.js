import React, { useEffect, useState } from "react";
import "../styles/TablePage.css";
import {
  fetchDebtsList,
  updateDebt,
  deleteDebt,
} from "../utils/debtsService";
import whatsappApi from "../utils/whatsappApi";

function NonPayers() {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [usingCache, setUsingCache] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [singleSendingId, setSingleSendingId] = useState(null);
  const [delaySeconds] = useState(60);

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

  const normalizePhoneNumber = (phone) =>
    phone?.toString().replace(/[^0-9]/g, "") || "";

  const buildReminderPayload = (person) => {
    const amountDisplay =
      typeof person.amount === "number" ? `${person.amount}$` : person.amount || "";
    const message = `مرحبًا ${person.name}، نذكّرك أن المبلغ (${amountDisplay}) لم يتم دفعه بعد.`;
    return {
      phone: normalizePhoneNumber(person.phone),
      message,
    };
  };

  const sendViaWhatsappApi = async (payload) => {
    if (!payload.phone) throw new Error("رقم الهاتف غير صالح");
    const response = await whatsappApi.post("/send_reminder", payload);
    return response?.data;
  };

  const openWaLink = (payload, closeAfterMs = 60000) => {
    if (!payload?.phone) return;
    const url = `https://web.whatsapp.com/send?phone=${payload.phone}&text=${encodeURIComponent(
      payload.message
    )}`;
    const newTab = window.open(url, "_blank");
    if (newTab && closeAfterMs > 0) {
      setTimeout(() => {
        try {
          newTab.close();
        } catch {
          /* ignore */
        }
      }, closeAfterMs);
    }
  };

  // 💬 إرسال تذكير واتساب
  const handleSendReminder = async (person) => {
    if (!person?.phone) {
      alert("رقم الهاتف غير متوفر.");
      return;
    }
    const payload = buildReminderPayload(person);
    setSingleSendingId(person._id);
    try {
      await sendViaWhatsappApi(payload);
      alert(`✅ تم إرسال التذكير إلى ${person.name}`);
    } catch (err) {
      console.error("Error sending WhatsApp reminder:", err);
      alert("⚠️ تعذر الاتصال بخادم الإرسال، سيتم فتح واتساب يدويًا.");
      openWaLink(payload, delaySeconds * 1000);
    } finally {
      setSingleSendingId(null);
    }
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
                      disabled={singleSendingId === person._id}
                    >
                      {singleSendingId === person._id ? "⏳ ..." : "💬 WhatsApp"}
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
              

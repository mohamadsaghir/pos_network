import React, {
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchDebtsList,
  updateDebt,
  deleteDebt,
} from "../utils/debtsService";
import "../styles/TablePage.css";

const TablePage = forwardRef(function TablePage({ setEditPerson }, ref) {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usingCache, setUsingCache] = useState(false);
  const navigate = useNavigate();

  // 🔄 تحميل البيانات
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await fetchDebtsList();
      setData(result.data);
      setUsingCache(result.source === "cache");
    } catch (err) {
      console.error("Error fetching data:", err);
      setUsingCache(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 👇 السماح لـ Home باستدعاء التحديث
  useImperativeHandle(ref, () => ({
    refreshTable: fetchData,
  }));

  useEffect(() => {
    fetchData();
  }, []);

  // ✏️ تعديل
  const handleEdit = (person) => {
    setEditPerson(person);
    navigate("/home");
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 200);
  };

  // 💰 تسديد
  const handleMarkPaid = async (person) => {
    try {
      const updatedPerson = { ...person, paid: true };
      setData((prev) =>
        prev.map((entry) =>
          entry._id === person._id ? { ...entry, paid: true } : entry
        )
      );
      const result = await updateDebt(person._id, updatedPerson);
      if (result.queued) {
        alert("تم حفظ التعديل محليًا، وسيتم إرساله عند توفر الإنترنت.");
      }
      await fetchData();
      if (!result.queued) {
        const message = `مرحبًا ${person.name}، تم تسديد فاتورتك بنجاح \nشكرًا لتسديدك smart net `;
        const url = `https://wa.me/+961${person.phone}?text=${encodeURIComponent(
          message
        )}`;
        window.open(url, "_blank");
      }
    } catch (err) {
      console.error("Error marking as paid:", err);
    }
  };

  // ↩️ إرجاع لغير مدفوع
  const handleMarkUnpaid = async (person) => {
    try {
      setData((prev) =>
        prev.map((entry) =>
          entry._id === person._id ? { ...entry, paid: false } : entry
        )
      );
      const updatedPerson = { ...person, paid: false };
      const result = await updateDebt(person._id, updatedPerson);
      if (result.queued) {
        alert("تم حفظ التعديل محليًا، وسيتم إرساله عند توفر الإنترنت.");
      } else {
        alert(`↩️ ${person.name} عاد لقائمة الغير دافعين.`);
      }
      await fetchData();
    } catch (err) {
      console.error("Error marking as unpaid:", err);
    }
  };

  // 💬 تذكير
  const handleSendReminder = (person) => {
    const message = `مرحبًا ${person.name} ، نذكّرك أن المبلغ المستحق (${person.amount}$) smart net لم يتم دفعه بعد. يرجى التجديد في أقرب وقت `;
    const url = `https://wa.me/+961${person.phone}?text=${encodeURIComponent(
      message
    )}`;
    window.open(url, "_blank");
  };

  // 🗑️ حذف
  const handleDelete = async (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الزبون؟")) {
      try {
        const result = await deleteDebt(id);
        if (result.queued) {
          alert("تم حفظ الحذف محليًا، وسيتم تنفيذه عند توفر الإنترنت.");
        }
        await fetchData();
      } catch (err) {
        console.error("Error deleting data:", err);
      }
    }
  };

  const filteredData = data.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone?.includes(searchTerm) ||
      item.boxName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="products-table-container">
      <h3>📋 قائمة الزبائن</h3>
      <input
        type="text"
        className="search-input responsive"
        placeholder="🔍 بالاسم أو الرقم أو اسم العلبة..."
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
        <p className="no-products">ما في بيانات 😅</p>
      ) : (
        <table className="products-table">
          <tbody>
            {filteredData.map((person) => (
              <tr key={person._id}>
                <td><strong> الاسم:</strong> {person.name}</td>
                <td><strong> الهاتف:</strong> {person.phone}</td>
                <td><strong> العلبة:</strong> {person.boxName}</td>
                <td>
                  <strong>💵 المبلغ:</strong>{" "}
                  <span className="product-price">$ {person.amount}</span>
                </td>
                <td>
                  <span
                    className={`product-status ${
                      person.paid ? "available" : "out-of-stock"
                    }`}
                  >
                    {person.paid ? "✅ مدفوع" : "❌ غير مدفوع"}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(person)}
                    >
                      ✏️ تعديل
                    </button>

                    {/* 💰 زر التسديد فقط إذا غير مدفوع */}
                    {!person.paid && (
                      <button
                        className="view-btn"
                        onClick={() => handleMarkPaid(person)}
                      >
                        💰 تسديد
                      </button>
                    )}

                    {/* 💬 زر التذكير فقط إذا غير مدفوع */}
                    {!person.paid && (
                      <button
                        className="view-btn"
                        onClick={() => handleSendReminder(person)}
                      >
                        💬 تذكير
                      </button>
                    )}
                    {/* ↩️ إعادة للحالة غير المدفوعة */}
                    {person.paid && (
                      <button
                        className="edit-btn"
                        onClick={() => handleMarkUnpaid(person)}
                      >
                        ↩️ إرجاع لغير مدفوع
                      </button>
                    )}

                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(person._id)}
                    >
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
});

export default TablePage;

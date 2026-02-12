import React, { useState } from "react";
import * as XLSX from "xlsx";
import { createDebt, fetchDebtsList, deleteAllDebts } from "../utils/debtsService";
import { exportAllDebtsToExcel } from "../utils/exportUtils";
import "../styles/TablePage.css"; // Reuse existing table styles

const ImportExcel = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [fileName, setFileName] = useState("");

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            // 🆕 Enable cellDates: true to parse dates correctly
            const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const parsedData = XLSX.utils.sheet_to_json(ws);

            // Map keys to match our schema if needed, or assume headers match
            // Expected headers: name, phone, boxName, amount, date
            const formattedData = parsedData.map(row => {
                let dateVal = row['date'] || row['التاريخ'] || new Date();

                // 🛠 Fix: Format date correctly if it's a Date object
                if (dateVal instanceof Date) {
                    // Add 1 day to fix potential timezone off-by-one errors from Excel
                    // dateVal.setDate(dateVal.getDate() + 1); 
                    dateVal = dateVal.toISOString().split('T')[0];
                }

                return {
                    name: row['name'] || row['الاسم'] || "",
                    phone: row['phone'] || row['الهاتف'] || "",
                    boxName: row['boxName'] || row['العلبة'] || "",
                    amount: row['amount'] || row['المبلغ'] || 0,
                    date: dateVal
                };
            });

            setData(formattedData);
        };
        reader.readAsBinaryString(file);
    };

    const handleUpload = async () => {
        if (data.length === 0) return;
        setLoading(true);
        let completed = 0;

        for (const item of data) {
            try {
                await createDebt(item);
            } catch (error) {
                console.error("Failed to upload item:", item, error);
            }
            completed++;
            setProgress(Math.round((completed / data.length) * 100));
        }

        setLoading(false);
        alert("✅ تم رفع الملف بنجاح!");
        setData([]);
        setFileName("");
        setProgress(0);
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            await exportAllDebtsToExcel();
            setLoading(false);
        } catch (error) {
            alert("❌ فشل التصدير");
            setLoading(false);
        }
    };

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passcode, setPasscode] = useState("");

    const handleLogin = (e) => {
        e.preventDefault();
        if (passcode === "75395123") {
            setIsAuthenticated(true);
        } else {
            alert("❌ رمز خاطئ!");
            setPasscode("");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="products-table-container" style={{ textAlign: "center", maxWidth: "500px", marginTop: "100px" }}>
                <h3>🔐 منطقة محمية</h3>
                <p style={{ color: "#8892b0", marginBottom: "20px" }}>يرجى إدخال رمز المرور للوصول إلى هذه الصفحة</p>
                <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <input
                        type="password"
                        className="search-input" // Reuse existing input style
                        placeholder="أدخل الرمز هنا..."
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        style={{ textAlign: "center", fontSize: "1.2rem", letterSpacing: "5px" }}
                        autoFocus
                    />
                    <button type="submit" className="glass-btn" style={{ width: "100%", justifyContent: "center" }}>
                        🔓 دخول
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="products-table-container">
            <h3>📂📥 استيراد وتصدير البيانات</h3>

            <div className="import-controls" style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '30px',
                borderRadius: '20px',
                marginBottom: '30px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                border: '1px solid rgba(100, 255, 218, 0.1)'
            }}>
                {/* قسم الاستيراد */}
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    id="excel-upload"
                />

                <label htmlFor="excel-upload" className="glass-btn" style={{ width: '100%', maxWidth: '400px' }}>
                    📂 اختر ملف Excel
                </label>

                {fileName && <p style={{ color: '#64ffda', marginTop: '-10px', fontSize: '0.9rem' }}>{fileName}</p>}

                {data.length > 0 && (
                    <button className="view-btn" onClick={handleUpload} disabled={loading} style={{ width: '100%', maxWidth: '400px', fontSize: '1.1rem', padding: '12px' }}>
                        {loading ? `جاري الرفع... ${progress}%` : "🚀 رفع البيانات"}
                    </button>
                )}

                {loading && (
                    <div style={{ width: '100%', maxWidth: '400px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: '#64ffda', transition: 'width 0.3s' }}></div>
                    </div>
                )}

                <div style={{ width: '80%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '10px 0' }}></div>

                {/* قسم التصدير */}
                <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                    <h4 style={{ margin: '0 0 15px 0', opacity: 0.8 }}>نسخة احتياطية</h4>
                    <button
                        className="outline-btn"
                        onClick={handleExport}
                        disabled={loading}
                    >
                        📤 تحميل جميع البيانات (Excel)
                    </button>
                </div>
            </div>

            <div style={{ width: '80%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '10px 0' }}></div>

            {/* قسم الحذف */}
            <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 15px 0', opacity: 0.8, color: '#ff6b6b' }}>منطقة الخطر</h4>
                <button
                    className="glass-btn-danger"
                    onClick={() => {
                        if (window.confirm("⚠️ هل أنت متأكد من حذف كل البيانات؟ لا يمكن التراجع عن هذا الإجراء!")) {
                            deleteAllDebts().then(() => alert("✅ تم حذف جميع البيانات."));
                        }
                    }}
                    disabled={loading}
                >
                    🗑️ حذف كل البيانات
                </button>
            </div>

            {
                data.length > 0 && (
                    <div style={{ overflowX: 'auto' }}>
                        <p style={{ marginBottom: '15px' }}>📋 معاينة البيانات ({data.length} صف):</p>
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>الاسم</th>
                                    <th>الهاتف</th>
                                    <th>العلبة</th>
                                    <th>المبلغ</th>
                                    <th>التاريخ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.slice(0, 10).map((row, index) => (
                                    <tr key={index}>
                                        <td>{row.name}</td>
                                        <td>{row.phone}</td>
                                        <td>{row.boxName}</td>
                                        <td><strong>{row.amount}$</strong></td>
                                        <td>{row.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {data.length > 10 && <p style={{ textAlign: 'center', marginTop: '15px', color: '#8892b0' }}>... والمزيد</p>}
                    </div>
                )
            }
        </div >
    );
};

export default ImportExcel;

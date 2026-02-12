import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./Home";
import TablePage from "./TablePage";
import Navbar from "../components/Navbar";
import Login from "./Login";
import Payers from "./Payers";        // ✅ استدعاء صفحة الدافعين
import NonPayers from "./NonPayers";  // ✅ استدعاء صفحة الغير دافعين
import ImportExcel from "./ImportExcel"; // ✅ استدعاء صفحة استيراد الملفات
import Totel from "./totel"; // ✅ استدعاء صفحة الإحصائيات
import About from "./About";

// ✅ مكون حماية المسارات
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [editPerson, setEditPerson] = useState(null);

  return (
    <Router>
      <div style={{ display: "flex" }}>
        {/* ✅ إظهار الناف بار فقط إذا كان المستخدم مسجلاً للدخول (اختياري، أو يمكن تركه ويتم التحكم به داخل الناف بار نفسه) */}
        <Navbar />
        <div style={{ flex: 1, padding: "20px" }}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />

            {/* ✅ حماية المسارات الخاصة */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home editPerson={editPerson} setEditPerson={setEditPerson} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/TablePage"
              element={
                <ProtectedRoute>
                  <TablePage setEditPerson={setEditPerson} />
                </ProtectedRoute>
              }
            />
            <Route path="/payers" element={<ProtectedRoute><Payers /></ProtectedRoute>} />
            <Route path="/nonpayers" element={<ProtectedRoute><NonPayers /></ProtectedRoute>} />
            <Route path="/import" element={<ProtectedRoute><ImportExcel /></ProtectedRoute>} />
            <Route path="/totel" element={<ProtectedRoute><Totel /></ProtectedRoute>} />
            <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  if (location.pathname === "/login") return null;

  const handleLinkClick = () => setOpen(false);

  // 🚪 تسجيل الخروج
  const handleLogout = () => {
    if (window.confirm("هل أنت متأكد من تسجيل الخروج؟")) {
      localStorage.removeItem("token"); // احذف التوكن أو أي بيانات دخول
      setOpen(false);
      navigate("/login"); // رجع المستخدم لصفحة تسجيل الدخول
    }
  };

  return (
    <>
      <button className="toggle-btn" onClick={() => setOpen(!open)}>
        ☰
      </button>

      <nav className={`navbar ${open ? "open" : "closed"}`}>
        <ul className="nav-links">
          <li><Link to="/home" onClick={handleLinkClick}>🏠 الصفحة الرئيسية</Link></li>
          <li><Link to="/TablePage" onClick={handleLinkClick}>📋 الجدول</Link></li>
          <li><Link to="/nonpayers" onClick={handleLinkClick}>❌ الغير دافعين</Link></li>
          <li><Link to="/payers" onClick={handleLinkClick}>💰 الدافعون</Link></li>
          <li><Link to="/import" onClick={handleLinkClick}>📂 استيراد/تصدير</Link></li>
          <li><Link to="/totel" onClick={handleLinkClick}>📊 الإحصائيات</Link></li>
          <li><Link to="/about" onClick={handleLinkClick}>ℹ️ عن التطبيق</Link></li>
        </ul>

        {/* 🚪 زر تسجيل الخروج */}
        <button className="logout-btn" onClick={handleLogout}>
          🚪 تسجيل الخروج
        </button>
      </nav>
    </>
  );
}

export default Navbar;

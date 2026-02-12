import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css"; // ✅ ملف الستايل الجديد
import logo from "../assets/image.png"; // ضع الصورة هنا داخل مجلد assets

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (username && password) {
      localStorage.setItem("token", "auth-token"); // ✅ حفظ التوكن
      navigate("/totel");
    } else {
      alert("يرجى إدخال اسم المستخدم وكلمة المرور");
    }
  };

  return (
    <div className="login-container">
      <div className="login-glass">
        {/* 🪙 الشعار */}
        <img src={logo} alt="PayFlow Logo" className="login-logo" />

        <h2>تسجيل الدخول</h2>

        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="اسم المستخدم"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">🚀 دخول</button>
        </form>
      </div>
    </div>
  );
}

export default Login;

import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./Home";
import TablePage from "./TablePage";
import Navbar from "../components/Navbar";
import Login from "./Login";
import Payers from "./Payers";        // ✅ استدعاء صفحة الدافعين
import NonPayers from "./NonPayers";  // ✅ استدعاء صفحة الغير دافعين
import About from "./About";

function App() {
  const [editPerson, setEditPerson] = useState(null);

  return (
    <Router>
      <div style={{ display: "flex" }}>
        <Navbar />
        <div style={{ flex: 1, padding: "20px" }}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/home"
              element={<Home editPerson={editPerson} setEditPerson={setEditPerson} />}
            />
            <Route
              path="/TablePage"
              element={<TablePage setEditPerson={setEditPerson} />}
            />
            {/* ✅ أضف المسارين الجدد */}
            <Route path="/payers" element={<Payers />} />
            <Route path="/nonpayers" element={<NonPayers />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

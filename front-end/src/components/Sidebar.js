import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Sidebar.css';

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <h2 className="logo">Offline Sub</h2>
        <ul className="sidebar-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/payers">الدافع</Link></li>
          <li><Link to="/non-payers">الغير دافع</Link></li>
          <li><Link to="/about">About</Link></li>
        </ul>
      </div>

      <button className="toggle-btn" onClick={toggleSidebar}>
        {isOpen ? '×' : '☰'}
      </button>
    </>
  );
}

export default Sidebar;

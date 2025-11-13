import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Wrench, Package, Hammer, ClipboardList, BarChart } from "lucide-react";

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/", icon: <Wrench size={18} /> },
    { name: "Parts", path: "/inventory", icon: <Package size={18} /> },
    { name: "Tools", path: "/tools", icon: <Hammer size={18} /> },  // ← FIXED
    { name: "Jobs", path: "/jobs", icon: <ClipboardList size={18} /> },
    { name: "Reports", path: "/reports", icon: <BarChart size={18} /> },
  ];

  return (
    <div className="bg-dark text-light vh-100 p-3" style={{ width: "220px" }}>
      <h4 className="text-warning mb-4">MechaTrack</h4>
      <ul className="list-unstyled">
        {navItems.map((item) => (
          <li key={item.name} className="mb-3">
            <Link
              to={item.path}
              className={`text-decoration-none d-flex align-items-center ${
                location.pathname === item.path ? "text-warning fw-bold" : "text-light"
              }`}
            >
              <span className="me-2">{item.icon}</span> {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
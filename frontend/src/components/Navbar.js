import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar navbar-dark bg-dark shadow-sm px-4 d-flex justify-content-between align-items-center">
      <span className="navbar-brand mb-0 h5 text-warning">
        Welcome to MechaTrack Garage System
      </span>

      <div className="d-flex align-items-center gap-3">
        <span className="text-light small">
          {user ? user.name : "Admin"}
        </span>

        {user && (
          <button className="btn btn-outline-light btn-sm" onClick={logout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
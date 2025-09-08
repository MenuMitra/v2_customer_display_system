import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png"; // ✅ Menumitra logo

function Header({ filter, onFilterChange, onRefresh }) {
  const [localFilter, setLocalFilter] = useState(filter || "today");
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const userId = localStorage.getItem("user_id");
  const outletName = localStorage.getItem("outlet_name"); // ✅ Get hotel/outlet name
  const navigate = useNavigate();

  useEffect(() => {
    setLocalFilter(filter || "today");
  }, [filter]);

  const changeFilter = (value) => {
    setLocalFilter(value);
    onFilterChange?.(value);
  };

  return (
    <>
      {/* Inline CSS for custom hover */}
      <style>
        {`
          .btn-outline-custom {
            background-color: transparent;
            color: #000;
            border: 1px solid #ccc;
            transition: background-color 0.2s, color 0.2s;
          }
          .btn-outline-custom:hover {
            background-color: #f1f1f1;
            color: #000;
            border-color: #bbb;
          }
        `}
      </style>

      {!isFullscreen && (
        <div
          style={{
            width: "100%",
            backgroundColor: "#b22222",
            color: "#fff",
            textAlign: "center",
            padding: "3px 0",
            fontSize: "14px",
            fontWeight: "bold",
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 1100,
          }}
        >
          Testing Environment
        </div>
      )}

      {!isFullscreen && (
        <header
          className="bg-white shadow-sm"
          style={{ marginTop: "35px", position: "relative" }}
        >
          <nav className="navbar navbar-expand-lg navbar-light py-2">
            <div className="container-fluid px-3 d-flex justify-content-between align-items-center">
              
              {/* ✅ Menumitra Logo + Name + Hotel/Outlet Name */}
              <div className="navbar-brand d-flex align-items-center gap-2">
                <img
                  src={logo}
                  alt="Menumitra Logo"
                  style={{ height: "35px", width: "35px", objectFit: "contain" }}
                />
                <span className="fs-5 fw-bold text-dark">Menumitra</span>
                {outletName && (
                  <span className="fs-6 fw-semibold ms-2 text-muted">
                    {outletName.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Center Title */}
              <div
                className="position-absolute top-50 start-50 translate-middle text-center"
                style={{ pointerEvents: "none" }}
              >
                <h1
                  className="mb-0 text-truncate"
                  style={{
                    fontSize: "clamp(20px, 5vw, 36px)",
                    fontWeight: "bold",
                    color: "#333",
                  }}
                >
                  K D S
                </h1>
              </div>

              {/* Right Section */}
              <div className="d-flex align-items-center" style={{ gap: "12px" }}>
                
                {/* Desktop filter buttons */}
                <div className="btn-group d-none d-lg-flex" role="group">
                  <button
                    type="button"
                    className={`btn ${localFilter === "today" ? "" : "btn-outline-custom"}`}
                    style={localFilter === "today" ? {
                      backgroundColor: "#0d6efd",
                      color: "#fff",
                      fontWeight: 700,
                      boxShadow: "0 0 12px rgba(13,110,253,0.7)",
                      border: "2px solid #0d6efd"
                    } : {}}
                    onClick={() => changeFilter("today")}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className={`btn ${localFilter === "all" ? "" : "btn-outline-custom"}`}
                    style={localFilter === "all" ? {
                      backgroundColor: "#0d6efd",
                      color: "#fff",
                      fontWeight: 700,
                      boxShadow: "0 0 12px rgba(13,110,253,0.7)",
                      border: "2px solid #0d6efd"
                    } : {}}
                    onClick={() => changeFilter("all")}
                  >
                    All
                  </button>
                </div>

                {/* Refresh */}
                <button
                  className="btn btn-outline-secondary"
                  title="Refresh"
                  onClick={() => onRefresh?.()}
                >
                  <i className="fa-solid fa-rotate" />
                </button>

                {/* Fullscreen */}
                <button
                  className="btn btn-outline-secondary"
                  title="Fullscreen"
                >
                  <i className="bx bx-fullscreen" />
                </button>

                {/* Logout */}
                <button
                  className="btn btn-outline-danger"
                  title="Logout"
                >
                  <i className="fa-solid fa-right-from-bracket"></i>
                </button>
              </div>
            </div>
          </nav>
        </header>
      )}
    </>
  );
}

export default Header;

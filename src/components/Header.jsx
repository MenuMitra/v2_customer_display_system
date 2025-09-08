import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";


function Header({ outletName, filter, onFilterChange }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      const logoutData = {
        user_id: localStorage.getItem("user_id"),
        role: "cds",
        app: "cds",
        device_token:
          "Entjx4wL350fdkAPvRs2YHKeBgImyElMnk5USx1QYz5UbWGooIt16BLTqGMsCdfzQPn9SKg3YtkQ94KHHqk.cYjkEmN.8nvp-Qyr",
      };

      const response = await fetch("https://men4u.xyz/common_api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logoutData),
      });

      const data = await response.json();

      if (data.st === 1) {
        localStorage.clear();
      }

      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      window.showToast("error", error.message || "Failed to log out.");
    }
  };

  const handleLogoutConfirm = (confirm) => {
    if (confirm) handleLogout();
    else setShowLogoutConfirm(false);
  };

  return (
    <>
      {/* Testing Environment Banner */}
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

      <header className="bg-white shadow-sm" style={{ marginTop: "25px" }}>
        <nav className="navbar navbar-expand-lg navbar-dark py-2">
          <div className="container-fluid px-5">
            {/* Brand/Logo */}
           <div className="navbar-brand d-flex align-items-center gap-2">
  <img
    src={logo}
    alt="Menumitra Logo"
    style={{ height: "35px", width: "35px", objectFit: "contain" }}
  />
  <span className="fs-4 fw-bold text-dark">Menumitra</span>
  {outletName && (
    <span className="fs-6 fw-semibold ms-2 text-muted">
      {outletName.toUpperCase()}
    </span>
  )}
</div>


            {/* Center Title */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
               transform: "translate(-50%, -50%)",
               fontSize: "36px",   // increased size
               fontWeight: "bold", // not bold
              color: "#000",
              zIndex: 1,
              }}
            >
              C D S
            </div>

            {/* Navigation Links */}
            <ul
              className="navbar-nav ms-auto align-items-center"
              style={{ gap: "8px" }}
            >
              <li className="nav-item">
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className={`btn ${
                      filter === "today" ? "btn-primary" : "btn-outline-primary"
                    }`}
                    onClick={() => onFilterChange("today")}
                    style={{
                      backgroundColor:
                        filter === "today" ? "#007bff" : "transparent",
                      color: filter === "today" ? "#fff" : "#007bff",
                      borderColor: "#007bff",
                      transition: "background-color 0.2s, color 0.2s",
                    }}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className={`btn ${
                      filter === "all" ? "btn-primary" : "btn-outline-primary"
                    }`}
                    onClick={() => onFilterChange("all")}
                    style={{
                      backgroundColor:
                        filter === "all" ? "#007bff" : "transparent",
                      color: filter === "all" ? "#fff" : "#007bff",
                      borderColor: "#007bff",
                      transition: "background-color 0.2s, color 0.2s",
                    }}
                  >
                    All
                  </button>
                </div>
              </li>

              {/* Fullscreen Icon */}
              <li className="nav-item">
                <div
                  className="nav-link d-flex align-items-center justify-content-center"
                  style={{
                    cursor: "pointer",
                    color: "grey",
                    border: "2px solid grey",
                    borderRadius: "8px",
                    width: "40px",
                    height: "40px",
                    fontSize: "20px", // reduced size
                  }}
                  onClick={() => {
                    if (location.pathname === "/orders") {
                      const container = document.querySelector(
                        ".container-fluid.p-0"
                      );
                      if (container && container.requestFullscreen) {
                        container.requestFullscreen();
                      } else if (
                        container &&
                        container.webkitRequestFullscreen
                      ) {
                        container.webkitRequestFullscreen();
                      } else if (
                        container &&
                        container.mozRequestFullScreen
                      ) {
                        container.mozRequestFullScreen();
                      } else if (
                        container &&
                        container.msRequestFullscreen
                      ) {
                        container.msRequestFullscreen();
                      }
                    } else {
                      navigate("/orders");
                    }
                  }}
                >
                  <i className="bx bx-fullscreen"></i>
                </div>
              </li>

              {/* Logout Icon */}
              {/* Logout Icon */}
<li className="nav-item">
  <div
    className="nav-link d-flex align-items-center justify-content-center"
    style={{
      cursor: "pointer",
      color: "red",
      border: "2px solid red",
      borderRadius: "8px",
      width: "40px",
      height: "40px",
      fontSize: "20px",
    }}
    onClick={() => setShowLogoutConfirm(true)}
  >
    <i className="fa-solid fa-right-from-bracket"></i>
  </div>
</li>

            </ul>
          </div>
        </nav>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <>
          <div
            className="modal-backdrop fade show"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 1040,
            }}
          />
          <div
            className="modal"
            tabIndex="-1"
            style={{
              display: "block",
              position: "fixed",
              top: "40%",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1050,
              width: "100%",
              maxWidth: "320px",
            }}
          >
            <div className="modal-dialog" style={{ margin: 0 }}>
              <div
                className="modal-content"
                style={{
                  border: "2px solid #dc3545",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                }}
              >
                {/* Centered Header with Red Icon */}
                <div className="modal-header d-flex justify-content-center">
                  <h5 className="modal-title fw-bold text-center">
                    <i
                      className="fa-solid fa-right-from-bracket me-2"
                      style={{ color: "red" }}
                    ></i>
                    Confirm Logout
                  </h5>
                </div>
                <div className="modal-body text-center">
                  <p className="fw-bold">Are you sure you want to logout?</p>
                </div>
                <div className="modal-footer justify-content-between">
        <button
        type="button"
    className="btn btn-secondary"
    onClick={() => handleLogoutConfirm(false)}
  >
    <i className="fa-solid fa-xmark me-1"></i> Cancel
  </button>
 <button
  type="button"
  className="btn btn-danger"
  onClick={() => handleLogoutConfirm(true)}
>
  <i className="fa-solid fa-right-from-bracket me-2"></i> Exit Me
</button>
</div>

              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Header;

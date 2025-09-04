import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Header({ outletName }) {
  const location = useLocation();
  const userId = localStorage.getItem("user_id");
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

      <header className="bg-dark" style={{ marginTop: "25px" }}>
        <nav className="navbar navbar-expand-lg navbar-dark py-2">
          <div className="container-fluid px-5">
            {/* Brand/Logo */}
            <div className="navbar-brand d-flex align-items-center">
              <span className="fs-4 fw-bold">
                {outletName ? outletName.toUpperCase() : ""}
              </span>
            </div>

            {/* Center Title */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "24px",
                fontWeight: "900",
                color: "#fcfbfbff",
                zIndex: 1,
              }}
            >
              Customer Display System
            </div>

            {/* Navigation Links */}
            <ul className="navbar-nav ms-auto align-items-center">
              <li className="nav-item fs-3">
                <div
                  className="nav-link px-3 text-white fs-3"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    if (location.pathname === "/orders") {
                      const container = document.querySelector(
                        ".container-fluid.p-0"
                      );
                      if (container && container.requestFullscreen) {
                        container.requestFullscreen();
                      } else if (container && container.webkitRequestFullscreen) {
                        container.webkitRequestFullscreen();
                      } else if (container && container.mozRequestFullScreen) {
                        container.mozRequestFullScreen();
                      } else if (container && container.msRequestFullscreen) {
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
              <li className="nav-item fs-3">
                <div
                  className="nav-link px-3 text-danger fs-3"
                  onClick={() => setShowLogoutConfirm(true)}
                  style={{ cursor: "pointer" }}
                >
                  <i className="bx bx-log-out"></i>
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
              maxWidth: "400px",
              margin: "0 auto",
            }}
          >
            <div className="modal-dialog" style={{ margin: 0 }}>
              <div className="modal-content">
                <div className="modal-header">
                  <i
                    className="fa-solid fa-right-from-bracket"
                    style={{ fontSize: 24, marginRight: 10, color: "#dc3545" }}
                  ></i>
                  <h5 className="modal-title">Confirm Logout</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowLogoutConfirm(false)}
                  ></button>
                </div>
                <div className="modal-body text-center">
                  <p>Are you sure you want to logout?</p>
                </div>
                <div className="modal-footer justify-content-center">
                  <button
                    type="button"
                    className="btn btn-secondary me-4"
                    onClick={() => handleLogoutConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleLogoutConfirm(true)}
                  >
                    Exit Me
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

// Clock Component
function Clock() {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="d-flex align-items-center">
      <i className="bi bi-clock me-2"></i>
      {time.toLocaleTimeString()}
    </div>
  );
}

export default Header;
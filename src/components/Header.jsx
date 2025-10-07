import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo.png";
import OutletDropdown from "./OutletDropdown";
import foodIcon from "../assets/food_icon.jpg";
import { handleApiError } from "../utils/sessionUtils";
import SubscriptionRemainDay from "./SubscriptionRemainDay";

function Header({ outletName, onRefresh }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [screenSize, setScreenSize] = useState(window.innerWidth);
  const [singleOutlet, setSingleOutlet] = useState(false);
  const [singleOutletName, setSingleOutletName] = useState("");

  const toTitleCase = (name) => {
    if (!name || typeof name !== "string") return "";
    return name
      .toLowerCase()
      .split(/\s+/)
      .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
      .join(" ");
  };

  const [dateRange, setDateRange] = useState(() => {
    const persisted = localStorage.getItem("statistics_date_range");
    if (persisted) {
      try {
        const parsed = JSON.parse(persisted);
        return parsed.type || "today";
      } catch {
        // Ignore JSON errors
      }
    }
    return "today";
  });
  useEffect(() => {
    // Clear persisted date range on every refresh so default is always today
    localStorage.removeItem("statistics_date_range");
    setDateRange("today");
  }, []);

  useEffect(() => {
    localStorage.setItem("statistics_date_range", JSON.stringify({ type: dateRange }));
  }, [dateRange]);

  // Fix page scroll on refresh - scroll to top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const authData = localStorage.getItem("authData");
  let token = null;
  if (authData) {
    try {
      token = JSON.parse(authData).access_token;
    } catch (err) {
      console.error("Failed to parse authData", err);
    }
  }

  // Detect if owner has exactly one outlet -> auto-select and hide dropdown
  useEffect(() => {
    try {
      const parsed = authData ? JSON.parse(authData) : null;
      const accessToken = parsed ? parsed.access_token : null;
      const ownerId = parsed ? (parsed.user_id || parsed.owner_id || null) : null;
      if (!accessToken || !ownerId) return;

      fetch("https://ghanish.in/v2/common/get_outlet_list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ owner_id: ownerId, app_source: "admin", outlet_id: 0 }),
      })
        .then((res) => res.json())
        .then((data) => {
          const outlets = Array.isArray(data?.outlets) ? data.outlets : [];
          if (outlets.length === 1) {
            const only = outlets[0];
            setSingleOutlet(true);
            setSingleOutletName(only.name || "");
            setSelectedOutlet(only);
          }
        })
        .catch(() => {});
    } catch {}
  }, []);

  const fetchOrders = async (outletId) => {
    if (!outletId) return;
    setLoading(true);
    setError("");
    try {
      const requestPayload = {
        outlet_id: outletId,
        date_filter: dateRange,
        owner_id: 1,
        app_source: "admin",
      };
      const response = await axios.post(
        "https://ghanish.in/v2/common/cds_kds_order_listview",
        requestPayload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = response.data;
      if (!data) {
        setOrders([]);
        setError("No data received");
      } else {
        const placedOrders =
          (data.placed_orders || []).map((order) => ({ ...order, status: "placed" })) || [];
        const ongoingOrders =
          (data.cooking_orders || []).map((order) => ({ ...order, status: "ongoing" })) || [];
        const completedOrders =
          (data.paid_orders || []).map((order) => ({ ...order, status: "completed" })) || [];
        const allOrders = [...placedOrders, ...ongoingOrders, ...completedOrders];
        setOrders(allOrders);
      }
    } catch (err) {
      // Check if it's a session expiration error and handle it
      if (handleApiError(err, navigate)) {
        return; // Session expired, user will be redirected
      }
      setError("Failed to fetch orders. Please try again.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Removed background get_outlet_list heartbeat to avoid repeated calls

  const handleOutletSelect = (outlet) => {
    setSelectedOutlet(outlet);
    fetchOrders(outlet.outlet_id);
  };

  useEffect(() => {
    if (selectedOutlet) {
      fetchOrders(selectedOutlet.outlet_id);
    }
  }, [dateRange, selectedOutlet]);

  useEffect(() => {
    const handleResize = () => setScreenSize(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!selectedOutlet) return;
    const interval = setInterval(() => {
      fetchOrders(selectedOutlet.outlet_id);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedOutlet, dateRange]);
  useEffect(() => {
    // Reset scroll on load with a delay to override browser restoration
    const timeoutId = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);

    // Reset scroll on page unload (for SPA navigation)
    const handleBeforeUnload = () => {
      window.scrollTo(0, 0);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const fontSizes =
    screenSize > 1200
      ? { header: "display-4", orderNumber: "display-5", itemCount: "display-6" }
      : { header: "h4", orderNumber: "h5", itemCount: "h6" };

      const OrderCard = ({ order, showIcon }) => {
        // Count the number of distinct menu items
        const menuCount = order.menu_details ? order.menu_details.length : 0;
      
        return (
          <div
            className="bg-white rounded-3 mb-2 p-3"
            style={{
              margin: "12px",
              fontSize: "1.8rem",
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <h2
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "bold",
                  marginBottom: 0,
                  display: "inline",
                }}
              >
                #{order.order_number}
              </h2>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "1.8rem",
                }}
              >
                <span>{menuCount}</span>
                {showIcon && (
                  <img
                    src={foodIcon}
                    alt="Food Icon"
                    style={{
                      height: "2.2rem",
                      width: "2.2rem",
                      verticalAlign: "middle",
                      marginBottom: 0,
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        );
      };
      

  const renderOrdersInSection = (statusFilter, title, bgColorClass) => (
    <div className={`col-12 col-md-4 ${bgColorClass}`} style={{ minHeight: "90vh" }}>
      <h3
        className="text-white text-center fw-bold mb-4"
        style={{ fontSize: "2.6rem", letterSpacing: "2px" }}
      >
        {title}
      </h3>
      {error ? (
        <div className="alert alert-danger text-center" role="alert">
          {error}
        </div>
      ) : (
        <>
          {orders
            .filter((order) => order.status === statusFilter)
            .map((order) => <OrderCard key={order.order_id} order={order} showIcon={true} />)}
        </>
      )}
    </div>
  );

  const handleLogout = async () => {
    try {
      const logoutData = {
        user_id: localStorage.getItem("user_id"),
        role: "cds",
        app: "cds",
        device_token:
          "Entjx4wL350fdkAPvRs2YHKeBgImyElMnk5USx1QYz5UbWGooIt16BLTqGMsCdfzQPn9SKg3YtkQ94KHHqk.cYjkEmN.8nvp-Qyr",
      };

      const response = await fetch("https://ghanish.in/common_api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logoutData),
      });
      // Best-effort: don't block on parsing
      await response.json().catch(() => null);
    } catch (error) {
      console.error("Error logging out:", error);
      window.showToast("error", error.message || "Failed to log out.");
    } finally {
      // Always clear local storage and redirect to login on Exit
      localStorage.clear();
      window.dispatchEvent(new CustomEvent('logout'));
      navigate("/login");
    }
  };

  const handleLogoutConfirm = (confirm) => {
    if (confirm) handleLogout();
    else setShowLogoutConfirm(false);
  };

  return (
    <>
      {/* Testing Banner */}
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
            {/* Brand/Logo with Outlet Dropdown */}
            <div className="navbar-brand d-flex align-items-center gap-2">
              <img
                src={logo}
                alt="Menumitra Logo"
                style={{ height: "35px", width: "35px", objectFit: "contain" }}
              />
              <span className="fs-4 fw-bold text-dark">Menumitra</span>
              <div>
                {singleOutlet ? (
                  <span style={{ fontSize: "1.3rem", color: "#9aa0a6", fontWeight: 600 }}>
                    {toTitleCase(singleOutletName)}
                  </span>
                ) : (
                  <OutletDropdown onSelect={handleOutletSelect} />
                )}
              </div>
            </div>
            {/* Center Title */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "36px",
                fontWeight: "bold",
                color: "#000",
                zIndex: 1,
              }}
            >
              C D S
            </div>

            {/* Navigation Links */}
            <ul className="navbar-nav ms-auto align-items-center" style={{ gap: "8px" }}>
              <li className="nav-item d-flex align-items-center flex-row">
                {/* Toggle for Today/All */}
                <div
                  className="btn-group"
                  role="group"
                  style={{
                    border: "1.2px solid #2376dcff",
                    borderRadius: "8px",
                    overflow: "hidden",
                    height: "40px",
                    width: "112px",
                    background: "#fff",
                  }}
                >
                  <button
                    type="button"
                    className="btn"
                    style={{
                      backgroundColor: dateRange === "today" ? "#0081ff" : "#ffffffff",
                      color: dateRange === "today" ? "#fff" : "#0081ff",
                      border: "none",
                      borderRadius: "8px 0 0 8px",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      minWidth: "56px",
                      height: "40px",
                      boxShadow: "none",
                      transition: "background-color 0.15s, color 0.15s",
                      padding: "0",
                      lineHeight: "40px",
                      textAlign: "center",
                    }}
                    onClick={() => setDateRange("today")}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      backgroundColor: dateRange === "all" ? "#0081ff" : "#fff",
                      color: dateRange === "all" ? "#fff" : "#0081ff",
                      border: "none",
                      borderRadius: "0 8px 8px 0",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      minWidth: "56px",
                      height: "40px",
                      boxShadow: "none",
                      transition: "background-color 0.15s, color 0.15s",
                      padding: "0",
                      lineHeight: "40px",
                      textAlign: "center",
                      borderLeft: "1px solid #babfc5",
                    }}
                    onClick={() => setDateRange("all")}
                  >
                    All
                  </button>
                </div>
                {/* Refresh Icon */}
                <button
                  className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                  title="Refresh"
                  onClick={() => {
                    if (selectedOutlet) {
                      fetchOrders(selectedOutlet.outlet_id);
                    }
                  }}
                  style={{
                    border: "2px solid #babfc5",
                    borderRadius: "8px",
                    width: "40px",
                    height: "40px",
                    marginLeft: "8px",
                    background: "#fff",
                    color: "#000",
                    transition: "none",
                  }}
                >
                  <i className="fa-solid fa-rotate" />
                </button>

                {/* Fullscreen Icon */}
                <button
                  className="btn d-flex align-items-center justify-content-center"
                  title="Fullscreen"
                  onClick={() => {
                    if (location.pathname === "/orders") {
                      const container = document.querySelector(".container-fluid.p-0");
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
                  style={{
                    border: "2px solid #babfc5",
                    borderRadius: "8px",
                    width: "40px",
                    height: "40px",
                    marginLeft: "8px",
                    background: "#fff",
                    color: "grey",
                  }}
                >
                  <i className="bx bx-fullscreen"></i>
                </button>
                {/* Logout Icon */}
                <button
                  className="btn d-flex align-items-center justify-content-center"
                  title="Logout"
                  onClick={() => setShowLogoutConfirm(true)}
                  style={{
                    border: "2px solid red",
                    borderRadius: "8px",
                    width: "40px",
                    height: "40px",
                    marginLeft: "8px",
                    background: "#fff",
                    color: "red",
                  }}
                >
                  <i className="fa-solid fa-right-from-bracket"></i>
                </button>
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
                  border: "1px solid #dc3545",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                }}
              >
                <div
                  className="modal-header d-flex justify-content-center align-items-center"
                  style={{ borderBottom: "1px solid #dee2e6" }}
                >
                  <h5 className="modal-title fw-bold text-center m-0">
                    <i
                      className="fa-solid fa-right-from-bracket me-2"
                      style={{ color: "red", paddingBottom: "10px" }}
                    ></i>
                    Confirm Logout
                  </h5>
                </div>
                <div className="modal-body d-flex justify-content-center align-items-center text-center">
                  <p className="fw-bold m-0">Are you sure you want to logout?</p>
                </div>
                <div
                  className="modal-footer d-flex justify-content-center"
                  style={{ borderTop: "1px solid #dee2e6", paddingTop: "10px", paddingBottom: "15px" }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '50px' }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleLogoutConfirm(false)}
                      style={{
                        backgroundColor: "white",
                        color: "#6c757d",
                        border: "1px solid #6c757d",
                        borderRadius: "15px",
                        padding: "8px 16px",
                        transition: "background-color 0.15s ease-in-out"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#e9ecef";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "white";
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleLogoutConfirm(true)}
                      style={{ borderRadius: "15px" }}
                    >
                      <i className="fa-solid fa-right-from-bracket me-2"></i> Exit Me
                    </button>
                  </div>

                  
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Orders Display Sections */}
      <div className="container-fluid p-0" style={{ background: "#fff", minHeight: "90vh" }}>
        {!selectedOutlet ? (
          <div>
            <div className="alert alert-warning text-center mb-0 rounded-0">
              Please select an outlet to view orders.
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div
                className="alert alert-danger text-center mt-3"
                role="alert"
                style={{ fontWeight: "bold" }}
              >
                {error}
              </div>
            )}

            <SubscriptionRemainDay selectedOutlet={selectedOutlet} dateRange={dateRange} />

            <div className="row g-0 min-vh-100" style={{ height: "90vh" }}>
              {/* PLACED */}
              {renderOrdersInSection("placed", "PLACED", "bg-secondary")}
              {/* COOKING */}
              {renderOrdersInSection("ongoing", "COOKING", "bg-warning")}
              {/* PICKUP */}
              {renderOrdersInSection("completed", "PICKUP", "bg-success")}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Header;
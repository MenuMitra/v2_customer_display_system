import React from 'react'
import { Link, useLocation ,useNavigate } from 'react-router-dom'

function Header() {
  const location = useLocation()

  const authData = JSON.parse(localStorage.getItem("authData"));
  const outletName = authData?.outlet_name; // Get 
  const userId = localStorage.getItem("user_id");// Get 
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      const logoutData = {
        user_id: localStorage.getItem("user_id"), // <-- Correct key here
        role: "cds",
        app: "cds",
        device_token: "Entjx4wL350fdkAPvRs2YHKeBgImyElMnk5USx1QYz5UbWGooIt16BLTqGMsCdfzQPn9SKg3YtkQ94KHHqk.cYjkEmN.8nvp-Qyr",
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
  
  
  
  return (
    <header className="bg-dark">
      <nav className="navbar navbar-expand-lg navbar-dark py-2">
        <div className="container-fluid px-5">
          {/* Brand/Logo */}
          <div className="navbar-brand d-flex align-items-center">
            <span className="fs-4 fw-bold">{outletName?.toUpperCase()}</span>
          </div>
        

          {/* Navigation Links */}
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item fs-3">
              <div className={`nav-link px-3 text-danger fs-3`} onClick={handleLogout}>
                <i className="bx bx-log-out"></i>
              </div>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}

// Clock Component
function Clock() {
  const [time, setTime] = React.useState(new Date())

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="d-flex align-items-center">
      <i className="bi bi-clock me-2"></i>
      {time.toLocaleTimeString()}
    </div>
  )
}

export default Header
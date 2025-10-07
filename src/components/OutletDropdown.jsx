import React, { useState, useEffect, useRef } from "react";
import { handleSessionExpired } from "../utils/sessionUtils";

const OutletDropdown = ({ onSelect }) => {
  const [outlets, setOutlets] = useState([]);
  const [filteredOutlets, setFilteredOutlets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [show, setShow] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const [hoveredOutletId, setHoveredOutletId] = useState(null);

  useEffect(() => {
    // Get user info including user_id and role from localStorage authData
    const authData = (() => {
      try {
        const data = localStorage.getItem("authData");
        return data ? JSON.parse(data) : null;
      } catch {
        return null;
      }
    })();
    // eslint-disable-next-line no-unused-vars
    const toCamelCase = (str) => {
      return str
        .toLowerCase()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };
    

    const token = authData ? authData.access_token : null;
    const userId = authData ? authData.user_id || authData.owner_id : null;
    // eslint-disable-next-line no-unused-vars
    const userRole = authData ? authData.role : null; // Adjust based on your auth data schema

    if (!token || !userId) {
      setOutlets([]);
      setFilteredOutlets([]);
      return;
    }

    setLoading(true);

    // Fetch outlets filtered by userId - backend should filter based on user role and associated outlets
    fetch("https://ghanish.in/v2/common/get_outlet_list", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        owner_id: userId, // pass userId or owner_id logged in
        app_source: "admin", // or your appropriate source
        outlet_id: 0, // or null if need all for that user
      }),
    })
      .then((res) => {
        // Check for 401 status
        if (res.status === 401) {
          return res.json().then(errorData => {
            const errorMessage = errorData?.detail || "";
            if (errorMessage.includes("Invalid or inactive session") || 
                errorMessage.includes("401") ||
                res.status === 401) {
              handleSessionExpired();
              return;
            }
            throw new Error(errorMessage || "Unauthorized");
          });
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          const outletsData = Array.isArray(data.outlets) ? data.outlets : [];
          setOutlets(outletsData);
          setFilteredOutlets(outletsData);
        }
        setLoading(false);
      })
      .catch(() => {
        setOutlets([]);
        setFilteredOutlets([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Filter outlets based on searchTerm (case-insensitive)
    if (searchTerm.trim() === "") {
      setFilteredOutlets(outlets);
    } else {
      const filtered = outlets.filter((outlet) =>
        outlet.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOutlets(filtered);
    }
  }, [searchTerm, outlets]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShow(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (outlet) => {
    setSelected(outlet);
    setShow(false);
    setSearchTerm("");
    if (onSelect) onSelect(outlet);
  };
  // eslint-disable-next-line no-unused-vars
  const toCamelCase = (str) => {
    return str
      .toLowerCase()
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div ref={dropdownRef} className="relative inline-block min-w-220px" style={{ position: "relative", borderRadius: "3px" }}>
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="w-100 select-outlet-btn"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#fff",
          color: "#b4b6b9ff",
          fontSize: "1.12rem",
          fontWeight: 500,
          padding: "0.32rem 1rem",
          border: "1.5px solid #d0d5dd",
          borderRadius: "15px",
          minHeight: "40px",
          textAlign: "left",
          boxShadow: "none",
          outline: "none",
          cursor: "pointer",
          transition: "background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease",
        }}
      >
        <span>{selected ? toCamelCase (selected.name) : "Select Outlet"}</span>
        <span style={{ display: "inline-block", width: "24px", height: "24px", verticalAlign: "middle", margin: "2px", transition: "transform 0.3s ease", transform: show ? "rotate(180deg)" : "rotate(0deg)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" style={{ display: "block" }} xmlns="http://www.w3.org/2000/svg">
            <polyline points="6 9 12 15 18 9" fill="none" stroke="#878a95" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {show && (
        <div className="dropdown-menu show shadow overflow-hidden" style={{ maxHeight: "440px", maxWidth: "300px", overflowY: "auto", overflowX: "hidden", background: "#fff" }}>
          <div className="p-2" style={{ background: "#d1d3d4" }}>
            <input
              type="search"
              className="form-control form-control-sm"
              style={{
                fontSize: "1.25rem",
                height: "3rem",
                width: "100%",
                borderRadius: "12px",
                padding: "0 1rem",
                boxSizing: "border-box",
                background: "#fff"
              }}
              placeholder="Search outlets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ul style={{ maxHeight: "250px", overflowY: "auto", overflowX: "hidden", paddingLeft: 0, marginBottom: 0, background: "#d1d3d4" }}>
            {loading && <li className="dropdown-item">Loading...</li>}
            {!loading && filteredOutlets.length === 0 && (
              <li className="dropdown-item text-center text-muted">No outlets found</li>
            )}
            {!loading &&
              filteredOutlets.map((outlet) => (
                <li
                  key={outlet.outlet_id}
                  style={{
                    listStyle: "none",
                    marginBottom: "14px",
                    padding: "0 8px" // inner padding for separation from sides
                  }}
                >
                  <button
                    className="w-full text-left"
                    onClick={() => handleSelect(outlet)}
                    style={{
                      background: "#fff",
                      color: "#222",
                      fontWeight: 500,
                      borderRadius: "12px",
                      border: hoveredOutletId === outlet.outlet_id ? "1.5px solid #0d6efd" : "1.5px solid transparent",
                      padding: "0 1rem", // horizontal padding to match input
                      minHeight: "6rem", // same min height as search bar
                      width: "100%",
                      textAlign: "left",
                      boxShadow: hoveredOutletId === outlet.outlet_id ? "0 4px 16px rgba(13,110,253,0.18)" : "0 1px 2px rgba(68, 73, 78, 0.11)",
                      fontSize: "1.25rem", // same font size as input
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: "1px"
                    }}
                    onMouseEnter={() => setHoveredOutletId(outlet.outlet_id)}
                    onMouseLeave={() => setHoveredOutletId(null)}
                  >
                    <span style={{ fontWeight: 700 }}>
                      {outlet.name} <span style={{ fontSize: "0.95rem", color: "#b0b6bb", fontWeight: 400 }}>{outlet.outlet_code}</span>
                    </span>
                    <span style={{ fontSize: "0.92rem", color: "#6e7479" }}>{outlet.address}</span>
                    <span style={{ fontSize: "0.85rem", color: "#2e3133" }}>{outlet.owner_name}</span>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default OutletDropdown;
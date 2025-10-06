import React, { useState, useEffect, useRef } from "react";
import { handleSessionExpired } from "../utils/sessionUtils";
import { API_URLS } from "../config/apiConfig";

const OutletSelectorDropdown = ({ onSelect }) => {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [show, setShow] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const token = (() => {
      try {
        const authData = localStorage.getItem("authtable")
        const token = localStorage.getItem("access_token")
        if(token){
          return token;
        }
        return null
      }catch {
        return null;
      }
    })();

    setLoading(true);
    fetch("https://ghanish.in/api/common/partner/outletlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ owner_id: 1, app_source: "admin", outlet_id: 642 }),
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
          setOutlets(Array.isArray(data.outlets) ? data.outlets : []);
        }
        setLoading(false);
      })
      .catch(() => {
        setOutlets([]);
        setLoading(false);
      });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShow(false);
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
    if (onSelect) onSelect(outlet);
  };

  return (
    <div
      ref={dropdownRef}
      className="relative inline-block min-w-[220px]"
      style={{ position: "relative" }}
    >
      <div className="dropdown">
  <button
    type="button"
    className="btn btn-outline-secondary dropdown-toggle w-100"
    onClick={() => setShow((s) => !s)}
    aria-expanded={show}
  >
    {selected ? selected.name : "Select Outlet"}
  </button>
  {show && (
    <ul className="dropdown-menu show">
      {/* dropdown items here */}
      <li><button className="dropdown-item">Outlet 1</button></li>
      <li><button className="dropdown-item">Outlet 2</button></li>
    </ul>
  )}
</div>

      {show && (
        <ul className="dropdown-menu show shadow overflow-y-auto" style={{ maxHeight: 240, width: "100%" }}>
          {loading && (
            <li className="dropdown-item">Loading...</li>
          )}
          {!loading &&
            outlets.map((outlet) => (
              <li key={outlet.outlet_id}>
                <button
                  className={`dropdown-item w-full text-left outlet-list-items ${
                    selected && selected.outlet_id === outlet.outlet_id
                      ? "font-bold bg-blue-100 text-blue-600"
                      : ""
                  }`}
                  onClick={() => handleSelect(outlet)}
                >
                  <div>{outlet.name} <span className="text-xs text-gray-500">({outlet.outlet_code})</span></div>
                  <div className="text-xs">{outlet.address}</div>
                  <div className="text-xs text-gray-700">{outlet.owner_name}</div>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

export default OutletSelectorDropdown;

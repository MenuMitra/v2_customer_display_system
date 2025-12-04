import React, { useState, useEffect, useRef } from "react";
import { handleSessionExpired } from "../utils/sessionUtils";
import { ENV } from "../config/apiConfig";

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
    fetch(`${ENV.API_BASE}/common/partner/outletlist`, {
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
    >
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 text-left text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        onClick={() => setShow((s) => !s)}
        aria-expanded={show}
      >
        {selected ? selected.name : "Select Outlet"}
      </button>
      {show && (
        <ul className="absolute z-50 mt-1 max-h-[240px] w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {loading && (
            <li className="px-4 py-2 text-sm text-gray-600">Loading...</li>
          )}
          {!loading &&
            outlets.map((outlet) => {
              const isSelected = selected && selected.outlet_id === outlet.outlet_id;
              return (
                <li key={outlet.outlet_id}>
                  <button
                    className={`w-full px-4 py-2 text-left transition-colors hover:bg-blue-50 hover:shadow-[0_4px_16px_rgba(13,110,253,0.18)] hover:border-[#0d6efd] ${
                      isSelected
                        ? "font-bold bg-blue-100 text-blue-600 border-[#0d6efd]"
                        : "border-transparent"
                    }`}
                    onClick={() => handleSelect(outlet)}
                  >
                    <div
                      title={`${outlet.name} (${outlet.outlet_code})`}
                      className="truncate"
                    >
                      {outlet.name} <span className="text-xs text-gray-500">({outlet.outlet_code})</span>
                    </div>
                    <div
                      className="text-xs text-gray-600"
                      title={outlet.address}
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        wordBreak: "break-word"
                      }}
                    >
                      {outlet.address}
                    </div>
                    <div
                      className="truncate text-xs text-gray-700"
                      title={outlet.owner_name}
                    >
                      {outlet.owner_name}
                    </div>
                  </button>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
};

export default OutletSelectorDropdown;
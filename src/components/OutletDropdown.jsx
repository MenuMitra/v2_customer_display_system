import React, { useState, useEffect, useRef } from "react";
import { handleSessionExpired } from "../utils/sessionUtils";
import { ENV } from "../config/apiConfig";

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
    fetch(`${ENV.V2_COMMON_BASE}/get_outlet_list`, {
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
    if (outlet && outlet.outlet_status === false) {
      return;
    }
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
    <div ref={dropdownRef} className="relative inline-block min-w-[220px] rounded-3xl">
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="flex w-full min-h-[40px] items-center justify-between rounded-3xl border-[1.5px] border-[#d0d5dd] bg-white px-4 py-[0.32rem] text-left text-[1.12rem] font-medium text-[#b4b6b9ff] outline-none transition-colors duration-300 ease-in-out hover:border-[#b0b6bb]"
      >
        <span>{selected ? toCamelCase(selected.name) : "Select Outlet"}</span>
        <span className={`inline-block h-6 w-6 align-middle transition-transform duration-300 ease-in-out ${show ? "rotate-180" : "rotate-0"}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" className="block" xmlns="http://www.w3.org/2000/svg">
            <polyline points="6 9 12 15 18 9" fill="none" stroke="#878a95" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {show && (
        <div className="absolute z-50 mt-1 max-h-[440px] w-full max-w-[300px] overflow-hidden overflow-y-auto overflow-x-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="bg-[#d1d3d4] p-2">
            <input
              type="search"
              className="h-9 w-full rounded-3xl border-0 bg-white px-4 text-[1.25rem] outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Search outlets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ul className="max-h-[250px] list-none overflow-y-auto overflow-x-hidden bg-[#d1d3d4] px-2 pb-0">
            {loading && (
              <li className="px-4 py-2 text-sm text-gray-600">Loading...</li>
            )}
            {!loading && filteredOutlets.length === 0 && (
              <li className="px-4 py-2 text-center text-sm text-gray-500">No outlets found</li>
            )}
            {!loading &&
              filteredOutlets.map((outlet) => {
                const isInactive = outlet.outlet_status === false;
                const isHovered = hoveredOutletId === outlet.outlet_id;
                return (
                  <li
                    key={outlet.outlet_id}
                    className="mb-[14px] list-none px-2"
                  >
                    <button
                      className={`flex min-h-[6rem] w-full flex-col justify-center gap-1 overflow-hidden rounded-[12px] border-[1.5px] px-4 text-left text-[1.25rem] font-medium transition-all ${
                        isInactive
                          ? "cursor-not-allowed border-[#ff4d4f] bg-[#ffecec] text-[#a8071a] opacity-90 shadow-[0_1px_2px_rgba(255,77,79,0.25)]"
                          : isHovered
                          ? "cursor-pointer border-[#0d6efd] bg-white text-[#222] shadow-[0_4px_16px_rgba(13,110,253,0.18)]"
                          : "cursor-pointer border-transparent bg-white text-[#222] shadow-[0_1px_2px_rgba(68,73,78,0.11)]"
                      }`}
                      onClick={() => handleSelect(outlet)}
                      disabled={isInactive}
                      aria-disabled={isInactive}
                      onMouseEnter={() => setHoveredOutletId(outlet.outlet_id)}
                      onMouseLeave={() => setHoveredOutletId(null)}
                    >
                      <span
                        title={`${outlet.name} (${outlet.outlet_code})`}
                        className="block max-w-full truncate font-bold"
                      >
                        {outlet.name}
                        {isInactive && (
                          <span className="ml-2 text-[0.9rem] font-semibold text-[#cf1322]">
                            (Inactive)
                          </span>
                        )}
                        <span className={`text-[0.95rem] font-normal text-[#b0b6bb] ${isInactive ? "ml-[6px]" : "ml-1"}`}>
                          {outlet.outlet_code}
                        </span>
                      </span>
                      <span
                        title={outlet.address}
                        className={`text-[0.92rem] capitalize ${isInactive ? "text-[#a8071a]" : "text-[#6e7479]"}`}
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
                      </span>
                      <span
                        title={outlet.owner_name}
                        className={`block max-w-full truncate text-[0.85rem] ${isInactive ? "text-[#a8071a]" : "text-[#2e3133]"}`}
                      >
                        {outlet.owner_name}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default OutletDropdown;
import React, { useEffect, useMemo, useRef, useState } from "react";
import { handleSessionExpired } from "../utils/sessionUtils";
import { ENV } from "../config/apiConfig";
import { useQuery } from "@tanstack/react-query";

const OutletDropdown = ({ onSelect }) => {
  const [outlets, setOutlets] = useState([]);
  const [filteredOutlets, setFilteredOutlets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [show, setShow] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const [hoveredOutletId, setHoveredOutletId] = useState(null);

  // Get user info including user_id and role from localStorage authData
  const authData = (() => {
    try {
      const data = localStorage.getItem("authData");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  })();

  const token = authData ? authData.access_token : null;
  const ownerId = authData ? authData.owner_id || authData.user_id : null;

  const { data: outletsResult, isLoading: outletsLoading } = useQuery({
    queryKey: ["outlets", ownerId],
    queryFn: async () => {
      if (!token || !ownerId) return { outlets: [] };
      const res = await fetch(`${ENV.V2_COMMON_BASE}/get_outlet_list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          owner_id: ownerId,
          // Use admin here so we still receive inactive outlets in the list.
          app_source: "admin",
          outlet_id: 0,
        }),
      });

      if (res.status === 401) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData?.detail || "";
        if (errorMessage.includes("Invalid or inactive session") || errorMessage.includes("401")) {
          handleSessionExpired();
          return { outlets: [] };
        }
        throw new Error(errorMessage || "Unauthorized");
      }
      return res.json();
    },
    enabled: !!token && !!ownerId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnMount: "always",
  });

  const outletsData = useMemo(
    () => (outletsResult && Array.isArray(outletsResult.outlets) ? outletsResult.outlets : []),
    [outletsResult]
  );

  // Determine if each outlet has KDS assigned (cached).
  // If unassigned, show as disabled and block selection.
  const { data: kdsStatusByOutletId } = useQuery({
    queryKey: ["outletKdsStatus", ownerId, outletsData.map((o) => o.outlet_id).join(",")],
    enabled: !!token && !!ownerId && outletsData.length > 0,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 0,
    queryFn: async () => {
      const map = {};
      for (const outlet of outletsData) {
        const outletId = Number(outlet?.outlet_id);
        if (!outletId) continue;
        // Don't call listview for inactive outlets; backend returns 400 and we already know it's disabled.
        if (Number(outlet?.outlet_status) === 0) {
          map[outletId] = "inactive";
          continue;
        }
        try {
          const res = await fetch(`${ENV.V2_COMMON_BASE}/cds_kds_order_listview`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              outlet_id: outletId,
              date_filter: "today",
              owner_id: Number(ownerId),
              app_source: "admin",
            }),
          });
          const data = await res.json().catch(() => ({}));
          const detail = typeof data?.detail === "string" ? data.detail : "";
          const detailLower = detail.toLowerCase();
          const outletInactive = detailLower.includes("outlet is currently inactive");
          const moduleUnassigned =
            detailLower.includes("kds module has not been assigned") ||
            detailLower.includes("cds module has not been assigned") ||
            detailLower.includes("module has not been assigned");
          map[outletId] = outletInactive ? "inactive" : moduleUnassigned ? "unassigned" : "assigned";
        } catch {
          // Safer default: disable if we can't verify.
          map[outletId] = "unknown";
        }
      }
      return map;
    },
  });

  useEffect(() => {
    if (outletsResult) {
      setOutlets(outletsData);
      setFilteredOutlets(outletsData);
    }
  }, [outletsResult, outletsData]);

  useEffect(() => {
    setLoading(outletsLoading);
  }, [outletsLoading]);

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
    if (outlet && outlet.outlet_status === 0) {
      return;
    }
    const outletId = Number(outlet?.outlet_id);
    const kdsStatus = outletId ? kdsStatusByOutletId?.[outletId] : undefined;
    if (kdsStatus !== "assigned") {
      return;
    }
    setSelected(outlet);
    setShow(false);
    setSearchTerm("");
    if (onSelect) onSelect(outlet);
  };
  // eslint-disable-next-line no-unused-vars
  const toCamelCase = (str) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
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
                const isInactive = outlet.outlet_status === 0;
                const outletId = Number(outlet?.outlet_id);
                const kdsStatus = outletId ? kdsStatusByOutletId?.[outletId] : undefined;
                const isKdsAssigned = kdsStatus === "assigned";
                const isKdsUnassigned = kdsStatus === "unassigned";
                const isKdsInactive = kdsStatus === "inactive";
                const isKdsChecking = !kdsStatus;
                const isDisabled = isInactive || !isKdsAssigned;
                const isHovered = hoveredOutletId === outlet.outlet_id;
                return (
                  <li
                    key={outlet.outlet_id}
                    className="mb-[14px] list-none px-2"
                  >
                    <button
                      className={`flex min-h-[6rem] w-full flex-col justify-center gap-1 overflow-hidden rounded-[12px] border-[1.5px] px-4 text-left text-[1.25rem] font-medium transition-all ${isInactive
                        ? "cursor-not-allowed border-[#ff4d4f] bg-[#ffecec] text-[#a8071a] opacity-90 shadow-[0_1px_2px_rgba(255,77,79,0.25)]"
                        : !isKdsAssigned
                          ? "cursor-not-allowed border-[#d0d5dd] bg-[#f3f4f6] text-[#6b7280] opacity-90 shadow-[0_1px_2px_rgba(17,24,39,0.08)]"
                          : isHovered
                          ? "cursor-pointer border-[#0d6efd] bg-white text-[#222] shadow-[0_4px_16px_rgba(13,110,253,0.18)]"
                          : "cursor-pointer border-transparent bg-white text-[#222] shadow-[0_1px_2px_rgba(68,73,78,0.11)]"
                        }`}
                      onClick={() => handleSelect(outlet)}
                      disabled={isDisabled}
                      aria-disabled={isDisabled}
                      title={
                        isInactive
                          ? "Outlet inactive"
                          : isKdsInactive
                            ? "Outlet inactive"
                          : isKdsUnassigned
                            ? "Module not assigned"
                            : isKdsChecking
                              ? "Checking KDS assignment…"
                              : undefined
                      }
                      onMouseEnter={() => setHoveredOutletId(outlet.outlet_id)}
                      onMouseLeave={() => setHoveredOutletId(null)}
                    >
                      <span
                        title={`${outlet.name} (${outlet.outlet_code})`}
                        className="block max-w-full truncate font-bold"
                      >
                        {toCamelCase(outlet.name)}
                        {isInactive && (
                          <span className="ml-2 text-[0.9rem] font-semibold text-[#cf1322]">
                            (Inactive)
                          </span>
                        )}
                        {isKdsUnassigned && (
                          <span className="ml-2 text-[0.9rem] font-semibold text-[#6b7280]">
                            (Module not assigned)
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
                        {toCamelCase(outlet.owner_name)}
                        {outlet.role && (
                          <span className="ml-1 text-[#6e7479]">
                            ({toCamelCase(outlet.role)})
                          </span>
                        )}
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
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo.png";
import OutletDropdown from "./OutletDropdown";
import foodIcon from "../assets/food_icon.jpg";
import { handleApiError } from "../utils/sessionUtils";
import SubscriptionRemainDay from "./SubscriptionRemainDay";
import { ENV } from "../config/apiConfig";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

function Header({ outletName, onRefresh }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [error, setError] = useState("");
  const [screenSize, setScreenSize] = useState(window.innerWidth);
  const [singleOutlet, setSingleOutlet] = useState(false);
  const [singleOutletName, setSingleOutletName] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTodayHovered, setIsTodayHovered] = useState(false);
  const [isAllHovered, setIsAllHovered] = useState(false);
  const [isFullscreenHovered, setIsFullscreenHovered] = useState(false);
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);

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
  let ownerId = null;
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      token = parsed.access_token;
      ownerId = parsed.owner_id || parsed.user_id || null;
    } catch (err) {
      console.error("Failed to parse authData", err);
    }
  }

  const { data: outletsResult } = useQuery({
    queryKey: ["outlets", ownerId],
    queryFn: async () => {
      if (!token || !ownerId) return { outlets: [] };
      const res = await fetch(`${ENV.V2_COMMON_BASE}/get_outlet_list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ owner_id: ownerId, app_source: "admin", outlet_id: 0 }),
      });
      return res.json();
    },
    enabled: !!token && !!ownerId,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (outletsResult) {
      const outlets = Array.isArray(outletsResult.outlets) ? outletsResult.outlets : [];
      if (outlets.length === 1) {
        const only = outlets[0];
        setSingleOutlet(true);
        setSingleOutletName(only.name || "");
        if (Number(only.outlet_status) === 0) {
          setSelectedOutlet(null);
          setError("Cannot select outlet because it is inactive. Please activate the outlet first.");
          return;
        }
        // Avoid auto-selecting outlets that don't have KDS assigned.
        (async () => {
          try {
            const auth = localStorage.getItem("authData");
            const parsed = auth ? JSON.parse(auth) : null;
            const tokenString = parsed ? parsed.access_token : null;
            const ownerId = parsed ? (parsed.owner_id || parsed.user_id || null) : null;
            if (!tokenString || !ownerId) return;

            const res = await fetch(`${ENV.V2_COMMON_BASE}/cds_kds_order_listview`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tokenString}`,
              },
              body: JSON.stringify({
                outlet_id: Number(only.outlet_id),
                date_filter: "today",
                owner_id: Number(ownerId),
                app_source: "admin",
              }),
            });
            const data = await res.json().catch(() => ({}));
            const detail = typeof data?.detail === "string" ? data.detail : "";
            const detailLower = detail.toLowerCase();
            const moduleUnassigned =
              detailLower.includes("kds module has not been assigned") ||
              detailLower.includes("cds module has not been assigned") ||
              detailLower.includes("module has not been assigned");
            const outletInactive = detailLower.includes("outlet is currently inactive");
            if (moduleUnassigned) {
              setSelectedOutlet(null);
              setError("Module has not been assigned for this outlet");
              return;
            }
            if (outletInactive) {
              setSelectedOutlet(null);
              setError("Cannot select outlet because it is inactive. Please activate the outlet first.");
              return;
            }
            setSelectedOutlet(only);
          } catch {
            setSelectedOutlet(null);
          }
        })();
      }
    }
  }, [outletsResult]);

  const fetchOrders = useCallback(async (outletId) => {
    if (!outletId) return [];
    try {
      const auth = localStorage.getItem("authData");
      const parsed = auth ? JSON.parse(auth) : null;
      const tokenString = parsed ? parsed.access_token : null;
      const ownerId = parsed ? (parsed.user_id || parsed.owner_id || 1) : 1;

      if (!tokenString) return [];

      const requestPayload = {
        outlet_id: Number(outletId),
        date_filter: dateRange,
        owner_id: Number(ownerId),
        app_source: "admin",
      };

      console.log("Header: Fetching orders with payload:", requestPayload);
      const response = await axios.post(
        `${ENV.V2_COMMON_BASE}/cds_kds_order_listview`,
        requestPayload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenString}`,
          },
        }
      );
      const data = response.data;
      console.log("Header: Orders API response:", data);
      if (!data) return [];

      const normalizedBuckets = {
        placed: [],
        ongoing: [],
        completed: [],
      };

      const toLower = (value) => (typeof value === "string" ? value.toLowerCase() : value);

      const pushToBucket = (order, statusKey, allowedStatuses, fallbackToAllItems = false) => {
        const menuItems = Array.isArray(order.menu_details) ? order.menu_details : [];

        // If the order itself has a status that matches what we're looking for, or if it has items that match
        const orderStatus = toLower(order.order_status || order.status);
        const matchesStatus = allowedStatuses.includes(orderStatus);

        const filteredItems = menuItems.filter((item) =>
          allowedStatuses.includes(toLower(item.menu_status))
        );

        let itemsToUse = filteredItems;

        if (itemsToUse.length === 0 && (fallbackToAllItems || matchesStatus)) {
          itemsToUse = menuItems;
        }

        // Even if menu_details is empty, if the order status matches, we should show it in the bucket
        // unless we strictly only want to show orders with specific items. 
        // For CDS, we generally want to show the whole order.
        if (!itemsToUse.length && !matchesStatus) return;

        normalizedBuckets[statusKey].push({
          ...order,
          status: statusKey,
          menu_details: itemsToUse,
        });
      };

      // v2 and v2.2 bucket keys
      const placedOrders = data.placed_orders || data.placed || [];
      const cookingOrders = data.cooking_orders || data.cooking || data.ongoing || [];
      const paidOrders = data.paid_orders || data.paid || data.completed_orders || [];
      const servedOrders = data.served_orders || data.served || [];

      (placedOrders || []).forEach((order) => {
        pushToBucket(order, "placed", ["placed"], true);
      });

      (cookingOrders || []).forEach((order) => {
        pushToBucket(order, "ongoing", ["cooking", "ongoing", "processing"]);
        pushToBucket(order, "completed", ["served", "ready", "completed"]);
      });

      (servedOrders || []).forEach((order) => {
        pushToBucket(order, "completed", ["served", "ready", "completed"], true);
      });

      (paidOrders || []).forEach((order) => {
        pushToBucket(order, "completed", ["served", "ready", "completed", "paid"], true);
      });

      // Also check for a flat "orders" list if buckets are empty
      if (normalizedBuckets.placed.length === 0 &&
        normalizedBuckets.ongoing.length === 0 &&
        normalizedBuckets.completed.length === 0 &&
        Array.isArray(data.orders)) {
        data.orders.forEach(order => {
          const status = toLower(order.status || order.order_status);
          if (status === "placed") pushToBucket(order, "placed", ["placed"], true);
          else if (["cooking", "ongoing", "preparing"].includes(status)) pushToBucket(order, "ongoing", ["cooking", "ongoing", "processing"]);
          else pushToBucket(order, "completed", ["served", "ready", "completed", "paid"], true);
        });
      }

      return [
        ...normalizedBuckets.placed,
        ...normalizedBuckets.ongoing,
        ...normalizedBuckets.completed,
      ];
    } catch (err) {
      if (handleApiError(err, navigate)) {
        throw err;
      }
      throw new Error("Failed to fetch orders. Please try again.");
    }
  }, [dateRange, navigate]);

  const {
    data: orders = [],
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["orders", selectedOutlet?.outlet_id, dateRange],
    queryFn: () => fetchOrders(selectedOutlet?.outlet_id),
    enabled: !!selectedOutlet?.outlet_id && !!token && Number(selectedOutlet?.outlet_status) !== 0,
    refetchInterval: (data, query) => {
      const msg = query?.state?.error?.message || "";
      const msgLower = typeof msg === "string" ? msg.toLowerCase() : "";
      if (
        msgLower.includes("outlet is currently inactive") ||
        msgLower.includes("module has not been assigned")
      ) {
        return false;
      }
      return 2000;
    },
    retry: 1,
  });

  useEffect(() => {
    if (queryError) {
      setError(queryError.message);
    } else {
      setError("");
    }
  }, [queryError]);

  // Removed background get_outlet_list heartbeat to avoid repeated calls

  const handleOutletSelect = (outlet) => {
    setSelectedOutlet(outlet);
  };

  useEffect(() => {
    const handleResize = () => setScreenSize(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (screenSize >= 992 && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [screenSize, isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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

  // eslint-disable-next-line no-unused-vars
  const fontSizes =
    screenSize > 1200
      ? { header: "display-4", orderNumber: "display-5", itemCount: "display-6" }
      : { header: "h4", orderNumber: "h5", itemCount: "h6" };

  const OrderCard = ({ order, showIcon }) => {
    // Count the number of distinct menu items, with fallbacks for v2.2 API
    const rawMenuCount =
      order.menu_count ??
      order.total_items ??
      order.item_count ??
      (order.menu_details ? order.menu_details.length : 0);
    const menuCount = Number(rawMenuCount) || 0;
    // Extract combo count from order object if provided by backend
    const comboCount = Number(order.combo_count ?? 0) || 0;
    const showMenuCount = menuCount > 0;
    const showComboCount = comboCount > 0;

    return (
      <div className="mb-2 rounded-3xl bg-white p-1 shadow-sm transition-shadow hover:shadow-md sm:mb-3 sm:p-3 md:mb-4 md:p-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="truncate text-base font-bold text-gray-900 sm:text-lg md:text-xl lg:text-2xl xl:text-3xl">
            #{order.order_number}
          </h2>
          <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
            {(showMenuCount || showComboCount) && (
              <span className="inline-flex items-center text-base font-semibold text-gray-700 sm:text-lg md:text-xl lg:text-2xl xl:text-3xl">
                {showMenuCount && menuCount}
                {showComboCount && (
                  <span
                    className={`${showMenuCount ? "ml-1 text-black font-bold" : ""}`}
                    style={showMenuCount ? { fontSize: "0.6em" } : undefined}
                  >
                    {showMenuCount ? `(+${comboCount} C)` : `${comboCount} C`}
                  </span>
                )}
              </span>
            )}
            {showIcon && (
              <img
                src={foodIcon}
                alt="Food Icon"
                className="h-5 w-5 object-contain sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 xl:h-10 xl:w-10"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderOrdersInSection = (statusFilter, title, bgColorClass) => (
    <div className={`flex-1 w-full h-full px-2 py-3 overflow-y-auto sm:px-3 sm:py-4 md:px-4 md:py-5 ${bgColorClass}`}>
      <h3 className="mb-2 text-center text-lg font-bold tracking-wide text-white sm:mb-3 sm:text-xl sm:tracking-wider md:mb-4 md:text-2xl lg:text-3xl xl:text-4xl">
        {title}
      </h3>
      {error ? (
        <div
          className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-600 sm:mt-3 sm:px-4 sm:py-2.5 sm:text-sm md:mt-4 md:px-5 md:py-3 md:text-base"
          role="alert"
        >
          {error}
        </div>
      ) : (
        <>
          {orders
            .filter((order) => order.status === statusFilter)
            .map((order) => (
              <OrderCard key={order.order_id} order={order} showIcon={true} />
            ))}
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

      const response = await fetch(`${ENV.COMMON_API_BASE}/logout`, {
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
      {/* Testing Environment Indicator */}
      {ENV.env === 'testing' && (
        <div className="w-full bg-red-600 py-0.5 text-center text-xs font-bold text-white">
          TESTING ENVIRONMENT
        </div>
      )}

      <header className="bg-white shadow-lg relative mt-0 mb-4">
        <nav className="bg-[#ffffff] py-1 sm:py-1.5 md:py-2 overflow-visible">
          <div className="relative flex w-full items-center justify-between px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 overflow-visible">
            {/* Brand/Logo with Outlet Dropdown */}
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-visible sm:gap-1.5 md:gap-2">
              <img
                src={logo}
                alt="Menumitra Logo"
                className="h-7 w-7 flex-shrink-0 object-contain sm:h-8 sm:w-8 md:h-[32px] md:w-[32px] lg:h-[35px] lg:w-[35px]"
              />
              <span className="hidden flex-shrink-0 text-sm font-bold text-black sm:inline sm:text-base md:text-lg lg:text-xl xl:text-2xl">Menumitra</span>
              <span className="inline flex-shrink-0 text-sm font-bold text-black sm:hidden">MM</span>
              <div className="relative z-10 flex-shrink-0 overflow-visible">
                {singleOutlet ? (
                  <div className="flex min-h-[40px] items-center rounded-3xl border-[1.5px] border-[#d0d5dd] bg-white px-4 py-[0.32rem] text-left text-[1.12rem] font-medium text-[#22242c] shadow-sm">
                    <span className="truncate text-xs font-bold text-black sm:text-sm md:text-base lg:text-lg xl:text-[1.3rem]">
                      {toTitleCase(singleOutletName)}
                    </span>
                  </div>
                ) : (
                  <OutletDropdown onSelect={handleOutletSelect} />
                )}
              </div>
            </div>
            <button
              className="absolute right-2 top-1/2 z-20 inline-flex -translate-y-1/2 items-center justify-center rounded-md border-0 bg-transparent p-1.5 text-black transition-opacity hover:opacity-80 sm:right-3 sm:p-2 md:right-4 md:p-2.5 lg:hidden"
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              <i className="fa-solid fa-bars text-lg sm:text-xl md:text-2xl"></i>
            </button>
            {/* Center Title */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 text-xl font-bold text-black lg:block lg:text-3xl xl:text-[36px]">
              C D S
            </div>

            {/* Navigation Links */}
            <div className={`absolute left-0 top-full z-30 w-full border-t bg-transparent ${isMobileMenuOpen ? "block" : "hidden"} lg:relative lg:top-0 lg:z-auto lg:mt-0 lg:flex lg:w-auto lg:border-0 lg:bg-transparent`}>
              <ul className="flex w-full flex-col gap-2 px-2 pb-2 pt-2 sm:gap-2.5 sm:px-3 sm:pb-3 sm:pt-3 lg:flex-row lg:items-center lg:justify-end lg:gap-2 lg:px-0 lg:pb-0 lg:pt-0">
                <li className="flex w-full flex-col gap-2 sm:gap-2.5 lg:flex-row lg:items-center lg:gap-2">
                  {/* Toggle for Today/All */}
                  <div
                    className="flex border border-2 rounded-3xl h-9 w-full overflow-hidden bg-transparent sm:h-10 md:h-11 lg:w-auto"
                    role="group"
                  >
                    <button
                      type="button"
                      className={`flex-1 min-w-[60px] rounded-l-3xl text-center text-xs font-semibold leading-9 transition-colors sm:min-w-[70px] rounded-l-3xl sm:text-sm sm:leading-10 md:min-w-[80px] md:leading-11 lg:flex-none lg:min-w-[90px] lg:px-4 ${dateRange === "today"
                        ? "bg-[#0081ff] text-white"
                        : isTodayHovered
                          ? "bg-[#f0f0f0] text-[#0081ff]"
                          : "bg-white text-[#0081ff] hover:bg-[#f0f0f0]"
                        }`}
                      onClick={() => setDateRange("today")}
                      onMouseEnter={() => {
                        if (dateRange !== "today") setIsTodayHovered(true);
                      }}
                      onMouseLeave={() => setIsTodayHovered(false)}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      className={`flex-1 min-w-[60px] rounded-r-3xl border-l border-[#babfc5] text-center text-xs font-semibold leading-9 transition-colors sm:min-w-[70px] rounded-r-3xl sm:text-sm sm:leading-10 md:min-w-[80px] md:leading-11 lg:flex-none lg:min-w-[90px] lg:px-4 ${dateRange === "all"
                        ? "bg-[#0081ff] text-white"
                        : isAllHovered
                          ? "bg-[#f0f0f0] text-[#0081ff]"
                          : "bg-white text-[#0081ff] hover:bg-[#f0f0f0]"
                        }`}
                      onClick={() => setDateRange("all")}
                      onMouseEnter={() => {
                        if (dateRange !== "all") setIsAllHovered(true);
                      }}
                      onMouseLeave={() => setIsAllHovered(false)}
                    >
                      All
                    </button>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex w-full items-center justify-start gap-8 sm:gap-10 md:gap-12 lg:w-auto lg:justify-start lg:gap-3">
                    {/* Refresh Icon */}
                    <button
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-3xl border-2 border-[#babfc5] bg-white text-black transition-colors hover:bg-gray-50 active:bg-gray-100 sm:h-10 sm:w-10 rounded-3xl md:h-11 md:w-11"
                      title="Refresh"
                      onClick={() => {
                        if (selectedOutlet) {
                          refetch();
                        }
                      }}
                    >
                      <i className="fa-solid fa-rotate text-sm text-black sm:text-base md:text-lg" />
                    </button>

                    {/* Fullscreen Icon */}
                    <button
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-3xl border-2 border-[#babfc5] bg-white text-black transition-colors hover:bg-gray-50 active:bg-gray-100 sm:h-10 sm:w-10 rounded-3xl md:h-11 md:w-11 ${isFullscreenHovered ? "bg-gray-50" : ""
                        }`}
                      title="Fullscreen"
                      onClick={() => {
                        if (location.pathname === "/orders") {
                          const container = document.querySelector(".orders-container");
                          if (!container) return;
                          if (container.requestFullscreen) {
                            container.requestFullscreen();
                          } else if (container.webkitRequestFullscreen) {
                            container.webkitRequestFullscreen();
                          } else if (container.mozRequestFullScreen) {
                            container.mozRequestFullScreen();
                          } else if (container.msRequestFullscreen) {
                            container.msRequestFullscreen();
                          }
                        } else {
                          navigate("/orders");
                        }
                      }}
                      onMouseEnter={() => setIsFullscreenHovered(true)}
                      onMouseLeave={() => setIsFullscreenHovered(false)}
                    >
                      <i className="bx bx-fullscreen text-sm text-black sm:text-base md:text-lg"></i>
                    </button>
                    {/* Logout Icon */}
                    <button
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center border-2 rounded-3xl border-red-500 bg-white text-black transition-colors hover:bg-[#ffe8e8] active:bg-[#ffe0e0] sm:h-10 sm:w-10  rounded-3xl md:h-11 md:w-11 ${isLogoutHovered ? "bg-[#ffe8e8]" : ""
                        }`}
                      title="Logout"
                      onClick={() => setShowLogoutConfirm(true)}
                      onMouseEnter={() => setIsLogoutHovered(true)}
                      onMouseLeave={() => setIsLogoutHovered(false)}
                    >
                      <i className="fa-solid fa-right-from-bracket text-sm text-red-600 sm:text-base md:text-lg"></i>
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <>
          <div className="fixed inset-0 z-[1040] bg-black/50" onClick={() => setShowLogoutConfirm(false)} />
          <div className="fixed inset-0 z-[1050] flex items-center justify-center px-4 sm:px-6 md:px-8" tabIndex="-1">
            <div className="w-full max-w-[280px] rounded-lg border-2 border-red-500 bg-white shadow-xl sm:max-w-[320px] sm:rounded-xl md:max-w-[360px] md:rounded-2xl">
              <div className="relative flex items-center justify-center border-b border-gray-200 px-4 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5">
                <h5 className="m-0 flex items-center text-center text-sm font-bold text-gray-900 sm:text-base md:text-lg">
                  <i className="fa-solid fa-right-from-bracket mr-2 text-red-600 sm:mr-2.5 md:mr-3"></i>
                  Confirm Logout
                </h5>
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>
              <div className="flex items-center justify-center px-4 py-4 text-center text-sm font-semibold text-gray-700 sm:px-5 sm:py-5 sm:text-base md:px-6 md:py-6 md:text-lg">
                <p className="m-0">Are you sure you want to logout?</p>
              </div>
              <div className="flex justify-center border-t border-gray-200 px-3 pb-4 sm:px-5 sm:pb-5 sm:pt-4 md:px-6 md:pb-6 md:pt-5">
                <div className="flex w-full items-center justify-between gap-3 sm:gap-4 md:gap-6">
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center py-[12px] rounded-full border border-1 border-gray-400 text-gray-500 transition-colors font-medium bg-white hover:bg-gray-200 active:bg-gray-300"
                    onClick={() => handleLogoutConfirm(false)}
                  >
                    <i className="fa-solid fa-xmark mr-2"></i> Cancel
                  </button>
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center rounded-3xl bg-red-600 py-[12px] text-[1.11rem] font-semibold text-white shadow-[0_1px_4px_rgba(44,51,73,0.07)] transition-colors hover:bg-red-700 active:bg-red-800"
                    onClick={() => handleLogoutConfirm(true)}
                  >
                    <i className="fa-solid fa-right-from-bracket mr-2"></i> Exit Me
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Orders Display Sections */}
      <div className="orders-container h-[calc(100vh-60px)] w-full bg-white p-0 overflow-hidden sm:h-[calc(100vh-70px)] md:h-[calc(100vh-80px)]">
        {!selectedOutlet ? (
          <div className="w-full border-y border-amber-300 bg-amber-100 py-2 text-center text-xs font-medium text-amber-900 sm:py-3 sm:text-sm md:py-4 md:text-base">
            Please select an outlet to view orders.
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {error && (
              <div
                className="mx-2 mt-2 flex-shrink-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-bold text-red-600 sm:mx-3 sm:mt-3 sm:px-4 sm:py-2.5 sm:text-sm md:mx-4 md:mt-4 md:px-5 md:py-3 md:text-base"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="flex-shrink-0">
              <SubscriptionRemainDay selectedOutlet={selectedOutlet} dateRange={dateRange} />
            </div>

            <div className="flex flex-1 flex-col overflow-x-auto sm:flex-row sm:items-stretch">
              {/* PLACED */}
              {renderOrdersInSection("placed", "PLACED", "bg-[#6c757d]")}
              {/* COOKING */}
              {renderOrdersInSection("ongoing", "COOKING", "bg-[#ffc107]")}
              {/* PICKUP */}
              {renderOrdersInSection("completed", "PICKUP", "bg-[#198754]")}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Header;
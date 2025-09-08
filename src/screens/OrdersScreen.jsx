import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";

function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [screenSize, setScreenSize] = useState(window.innerWidth);
  const [error, setError] = useState("");
  const [outletName, setOutletName] = useState("");
  const [filter, setFilter] = useState("today"); // Default to "today"
  const authData = JSON.parse(localStorage.getItem("authData"));

  // Create axios instance with default config
  const api = axios.create({
    baseURL: "https://men4u.xyz/v2",
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Add interceptor to handle 401 errors globally
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.warn("Unauthorized detected → logging out in 2s...");
        setTimeout(() => {
          localStorage.clear();
          window.location.href = "/login";
        }, 2000); // silent logout after 2 seconds
      }
      return Promise.reject(error);
    }
  );

  const fetchOrders = async (retryCount = 3, delay = 2000) => {
    const authData = JSON.parse(localStorage.getItem("authData"));
    const outlet_id = authData?.outlet_id;
    const accessToken = authData?.access_token;

    if (!outlet_id || !accessToken) {
      return;
    }

    try {
      const { data } = await api.post(
        "/common/cds_kds_order_listview",
        { outlet_id, date_filter: filter },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!data || (!data.placed_orders && !data.cooking_orders && !data.paid_orders)) {
        throw new Error("Invalid response structure from server");
      }

      let outletNameResp = "";
      if (data.placed_orders?.length) {
        outletNameResp = data.placed_orders[0].outlet_name;
      } else if (data.cooking_orders?.length) {
        outletNameResp = data.cooking_orders[0].outlet_name;
      } else if (data.paid_orders?.length) {
        outletNameResp = data.paid_orders[0].outlet_name;
      }
      setOutletName(outletNameResp);

      const placedOrders = (data.placed_orders || []).map((order) => ({
        ...order,
        status: "placed",
      }));
      const ongoingOrders = (data.cooking_orders || []).map((order) => ({
        ...order,
        status: "ongoing",
      }));
      const completedOrders = (data.paid_orders || []).map((order) => ({
        ...order,
        status: "completed",
      }));

      setOrders([...placedOrders, ...ongoingOrders, ...completedOrders]);
      setError("");
    } catch (error) {
      if (!error.response || error.response?.status !== 401) {
        setError("Failed to fetch orders. Please try again.");
        console.error("Order List View Error:", error);
      }
    }
  };

  useEffect(() => {
    fetchOrders();
    const intervalId = setInterval(() => fetchOrders(), 2000);
    return () => clearInterval(intervalId);
  }, [filter]);

  useEffect(() => {
    const handleResize = () => setScreenSize(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getFontSizes = () => {
    if (screenSize >= 2560) {
      return { header: "display-2", orderNumber: "display-3", itemCount: "display-4" };
    } else if (screenSize >= 1920) {
      return { header: "display-3", orderNumber: "display-4", itemCount: "display-5" };
    } else if (screenSize >= 1200) {
      return { header: "display-4", orderNumber: "display-5", itemCount: "display-6" };
    } else if (screenSize >= 768) {
      return { header: "display-5", orderNumber: "display-6", itemCount: "h2" };
    } else {
      return { header: "display-6", orderNumber: "h2", itemCount: "h3" };
    }
  };

  const fontSizes = getFontSizes();

  const OrderCard = ({ order }) => (
    <div className="bg-white rounded-3 mb-2 p-0.9 p-md-0.9 order-card">
      <div className="d-flex justify-content-between align-items-center mb-2 p-3">
        <h2 className={`${fontSizes.orderNumber} fw-bold mb-0`}>#{order.order_number}</h2>
        <div className="d-flex align-items-center">
          <span className={`${fontSizes.itemCount} me-3`}>
            <i className="bx bx-restaurant text-warning fs-1"></i>
          </span>
          <span className={`${fontSizes.itemCount} fs-1`}>
            {Array.isArray(order.table_number) ? order.table_number.join(", ") : ""}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Header
        outletName={outletName}
        filter={filter}
        onFilterChange={(newFilter) => {
          setFilter(newFilter);
          fetchOrders();
        }}
      />
      <div className="container-fluid p-0">
        <div className="row g-0 min-vh-100">
          
          {/* Left Side - Placed Orders */}
          <div className="col-12 col-md-4 bg-secondary">
            <div className="p-2 p-sm-3 p-md-4">
              <h1 className={`${fontSizes.header} text-white text-center fw-bold mb-3 mb-md-4`}>
                PLACED
              </h1>
              {error ? (
                <div className="alert alert-danger text-center" role="alert">
                  {error}
                </div>
              ) : (
                <div className="orders-container">
                  {orders.filter((order) => order.status === "placed").map((order) => (
                    <OrderCard key={order.order_id} order={order} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center - Ongoing Orders */}
          <div className="col-12 col-md-4 bg-warning cooking-section">
            <div className="p-2 p-sm-2 p-md-2">
              <h1 className={`${fontSizes.header} text-white text-center fw-bold mb-3 mb-md-1`}>
                COOKING
              </h1>
              <div className="orders-container">
                {orders.filter((order) => order.status === "ongoing").map((order) => (
                  <OrderCard key={order.order_id} order={order} />
                ))}
              </div>
            </div>
          </div>

          {/* Right - Completed Orders */}
          <div className="col-12 col-md-4 bg-success">
            <div className="p-2 p-sm-3 p-md-4">
              <h1 className={`${fontSizes.header} text-white text-center fw-bold mb-3 mb-md-4`}>
                PAID
              </h1>
              <div className="orders-container">
                {orders.filter((order) => order.status === "completed").map((order) => (
                  <OrderCard key={order.order_id} order={order} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default OrdersScreen;

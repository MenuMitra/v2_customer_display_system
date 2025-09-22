import React, { useState, useEffect, useRef } from "react";

const OutletDropdown = ({ onSelect }) => {
  const [outlets, setOutlets] = useState([]);
  const [filteredOutlets, setFilteredOutlets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [show, setShow] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const token = (() => {
      try {
        const authData = localStorage.getItem("authData");
        return authData ? JSON.parse(authData).access_token : null;
      } catch {
        return null;
      }
    })();

    setLoading(true);
    fetch("https://men4u.xyz/v2/common/get_outlet_list", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ owner_id: 1, app_source: "admin", outlet_id: 642 }),
    })
      .then((res) => res.json())
      .then((data) => {
        const outletsData = Array.isArray(data.outlets) ? data.outlets : [];
        setOutlets(outletsData);
        setFilteredOutlets(outletsData);
        setLoading(false);
      })
      .catch(() => {
        setOutlets([]);
        setFilteredOutlets([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Filter outlets based on searchTerm (case-insensitive search on name)
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
        setSearchTerm(""); // Clear search when dropdown closes
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
    setSearchTerm(""); // Clear search on selection
    if (onSelect) onSelect(outlet);
  };

  return (
    <div
  ref={dropdownRef}
  className="relative inline-block min-w-[220px]"
  style={{ position: "relative", borderRadius: "3px" }}
>
  <button
    type="button"
    onClick={() => setShow((s) => !s)}
    className="w-100 select-outlet-btn"
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#fff",
      color: "#b4b6b9ff",
      fontSize: "1.12rem",
      fontWeight: "500",
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
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#e6e6e6';
      e.currentTarget.style.color = '#939090ff';
      e.currentTarget.style.borderColor = '#dcd8d8ff';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = '#fff';
      e.currentTarget.style.color = '#a5a6a9ff';
      e.currentTarget.style.borderColor = '#d0d5dd';
    }}
  >
    <span>{selected ? selected.name : "Select Outlet"}</span>
    <span
      style={{
        display: "inline-block",
        width: "24px",
        height: "24px",
        verticalAlign: "middle",
        margin: "2px",
        transition: "transform 0.3s ease",
        transform: show ? "rotate(180deg)" : "rotate(0deg)",
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        style={{ display: "block" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <polyline
          points="6 9 12 15 18 9"
          fill="none"
          stroke="#878a95"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  </button>

  {show && (
   <div
  className="dropdown-menu show shadow overflow-hidden"
  style={{
    maxHeight: 290,
    minWidth: 290,
    overflowY: "auto",
    background: "#d1d3d4", // soft light gray background as container
    border: "none"
  }}
>
  <div className="p-2" style={{ background: "#d1d3d4" }}>
    <input
      type="search"
      className="form-control form-control-sm"
      style={{
        fontSize: "1.25rem",
        height: "3rem",
        width: "100%"
      }}
      placeholder="Search outlets..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>

  <ul
    style={{
      maxHeight: 250,
      overflowY: "auto",
      paddingLeft: 0,
      marginBottom: 0,
      background: "#d1d3d4"
    }}
  >
    {loading && <li className="dropdown-item">Loading...</li>}

    {!loading &&
      filteredOutlets.map((outlet) => (
        <li key={outlet.outlet_id} style={{ listStyle: "none", marginBottom: "12px" }}>
          <button
            className={`w-full text-left`}
            onClick={() => handleSelect(outlet)}
            style={{
              background: "#787a7bff", // dark gray, not black
              color: "#f1f3f5",      // soft white text
              fontWeight: 500,
              borderRadius: "10px",
              border: "none",
              padding: "13px 18px",
              width: "100%",
              textAlign: "left",
              boxShadow: "0 1px 2px rgba(68, 73, 78, 0.1)",
              fontSize: "1.13rem"
            }}
          >
            {outlet.name}
            {" "}
            <span style={{ fontSize: "0.93rem", color: "#b0b6bb", fontWeight: 400 }}>
              ({outlet.outlet_code})
            </span>
            <div style={{ fontSize: "0.90rem", color: "#d2d7dc", marginTop: 2 }}>
              {outlet.address}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#b0b6bb" }}>{outlet.owner_name}</div>
          </button>
        </li>
      ))}

    {!loading && filteredOutlets.length === 0 && (
      <li className="dropdown-item text-center text-muted">No outlets found</li>
    )}
  </ul>
</div>



  )}
</div>


  );
};

export default OutletDropdown;

import React from "react";
import logo from "../assets/logo.png";

const Footer = () => {
  return (
    <div className="cds-footer-wrap" style={{ textAlign: "center" }}>
      <div style={{ height: "2px" }} />
      <div
        className="cds-footer-social"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "30px",
          marginTop: "10px",
          marginBottom: "10px",
        }}
      >
        <a
          href="https://www.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="cds-social-btn"
          aria-label="Google"
          style={{
            fontSize: "2.4rem",
            color: "#55a845",
            background: "#f8f9fa",
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i className="ri-google-fill" />
        </a>
        <a
          href="https://www.facebook.com/people/Menu-Mitra/61565082412478/"
          target="_blank"
          rel="noopener noreferrer"
          className="cds-social-btn"
          aria-label="Facebook"
          style={{
            fontSize: "2.4rem",
            color: "#3388ff",
            background: "#f8f9fa",
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i className="ri-facebook-fill" />
        </a>
        <a
          href="https://www.instagram.com/menumitra/"
          target="_blank"
          rel="noopener noreferrer"
          className="cds-social-btn"
          aria-label="Instagram"
          style={{
            fontSize: "2.4rem",
            color: "#e33161",
            background: "#f8f9fa",
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i className="ri-instagram-fill" />
        </a>
        <a
          href="https://www.youtube.com/@menumitra"
          target="_blank"
          rel="noopener noreferrer"
          className="cds-social-btn"
          aria-label="YouTube"
          style={{
            fontSize: "2.4rem",
            color: "#ee2329",
            background: "#f8f9fa",
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i className="ri-youtube-fill" />
        </a>
      </div>
      <div
        className="cds-version-row"
        style={{
          marginTop: "1px",
          marginBottom: "8px",
          color: "#757c8a",
          fontSize: "0.8rem",
        }}
      >
        <span className="cds-version">Version 2.0</span>
        <span style={{ margin: "0 3px" }}>|</span>
        <span className="cds-release-date">23 Sep 2025</span>
      </div>
    </div>
  );
};

export default Footer;

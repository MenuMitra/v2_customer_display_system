import React from "react";
import logo from "../assets/logo.png";

const Footer = () => {
  return (
    <div className="cds-footer-wrap">
      {/* Logo + Name */}
      <div className="cds-footer-brand">
        <img src={logo} alt="MenuMitra" className="cds-footer-logo" />
        <span className="cds-footer-name">MenuMitra</span>
      </div>

      {/* Social icons */}
      <div className="cds-footer-social">
        <a
          href="https://www.facebook.com/people/Menu-Mitra/61565082412478/"
          target="_blank"
          rel="noopener noreferrer"
          className="cds-social-btn"
          aria-label="Facebook"
        >
          <i className="ri-facebook-fill" />
        </a>
        <a
          href="https://www.instagram.com/menumitra/"
          target="_blank"
          rel="noopener noreferrer"
          className="cds-social-btn"
          aria-label="Instagram"
        >
          <i className="ri-instagram-fill" />
        </a>
        <a
          href="https://www.youtube.com/@menumitra"
          target="_blank"
          rel="noopener noreferrer"
          className="cds-social-btn"
          aria-label="YouTube"
        >
          <i className="ri-youtube-fill" />
        </a>
        <a
          href="https://www.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="cds-social-btn"
          aria-label="Google"
        >
          <i className="ri-google-fill" />
        </a>
      </div>

      {/* Version + Date */}
      <div className="cds-version-row">
        <span className="cds-version">version 2.0</span>
        <span className="cds-release-date">13 Aug 2025</span>
      </div>
    </div>
  );
};

export default Footer;
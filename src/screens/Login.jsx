import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { authService } from "../services/authService";
import Footer from "../components/Footer";

function Login() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpValues, setOtpValues] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    if (!mobileNumber || mobileNumber.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    try {
      setLoading(true);
      const response = await authService.sendOTP(mobileNumber);
      if (response.success) {
        setShowOtpInput(true);
        setOtpValues(["", "", "", ""]);
      } else {
        setError(response.error || "Failed to send OTP");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);
    if (value !== "" && index < 3) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    const otp = otpValues.join("");
    if (!otp || otp.length !== 4) {
      setError("Please enter a valid 4-digit OTP");
      return;
    }
    try {
      setLoading(true);
      const response = await authService.verifyOTP(mobileNumber, otp);
      if (response.success) {
        navigate("/orders");
      } else {
        setError(response.error || "Invalid OTP");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "#f9fafd",
        minHeight: "100vh",
        width: "100vw",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="login-card shadow-sm"
        style={{
          width: "100%",
          border: "1.8px solid #d1d9e4ff",
          borderRadius: "18px",
          background: "#fff",
          boxSizing: "border-box",
          padding: "32px 32px 28px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          margin: "10px 0 0 0",
        }}
      >
        {/* Logo, Title, Subtitle Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          <img
            src={logo}
            alt="MenuMitra"
            style={{ width: "55px", height: "55px", marginBottom: "10px" }}
          />
          <div
            style={{
              fontWeight: 600,
              fontSize: "1.50rem",
              textAlign: "center",
              color: "#22242c",
              marginBottom: "7px",
            }}
          >
            MenuMitra
          </div>
          <div
            style={{
              color: "#666b7c",
              fontSize: "1rem",
              textAlign: "center",
              fontWeight: 400,
              marginBottom: "22px",
            }}
          >
            Sign in to continue to your account
          </div>
        </div>
        <form
          id="formAuthentication"
          onSubmit={showOtpInput ? handleVerifyOTP : handleSendOTP}
          noValidate="novalidate"
          style={{ width: "100%" }}
        >
          {error && (
            <div
              className="alert alert-danger mb-3"
              role="alert"
              style={{ fontSize: "1rem" }}
            >
              {error}
            </div>
          )}
          {/* Hide mobile input field from view when OTP input should show */}
          {!showOtpInput && (
            <div style={{ marginBottom: "17px" }}>
              <label
                htmlFor="mobile"
                style={{
                  fontSize: "1.07rem",
                  fontWeight: 400,
                  marginBottom: 6,
                  display: "block",
                  color: "#22242c",
                }}
              >
                Mobile Number <span style={{ color: "#cb1227" }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                id="mobile"
                name="mobile"
                placeholder="Enter your mobile number"
                value={mobileNumber}
                onChange={(e) =>
                  setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                autoFocus={!showOtpInput}
                disabled={showOtpInput}
                style={{
                  fontSize: "1.08rem",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1.1px solid #ddd",
                  height: "48px",
                  marginBottom: "12px",
                  background: showOtpInput ? "#f3f4f7" : "#fff",
                  color: showOtpInput ? "#a0a4b0" : "#22242c",
                  transition: "background 0.2s",
                }}
              />
              <button
                className="btn btn-primary w-100"
                type="submit"
                disabled={loading}
                style={{
                  padding: "15px 0",
                  fontSize: "1.11rem",
                  borderRadius: "10px",
                  background: "#178be2",
                  color: "#fff",
                  border: "none",
                  marginTop: "2px",
                  fontWeight: 600,
                  boxShadow: "0 1px 4px rgba(44,51,73,0.07)",
                }}
              >
                {loading ? (
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  />
                ) : (
                  "Send OTP"
                )}
              </button>
            </div>
          )}
          {showOtpInput && (
            <div style={{ marginBottom: "21px" }}>
              <div
                className="text-center mb-3"
                style={{ fontSize: "1rem", fontWeight: 500, color: "#22242c" }}
              >
                Enter the 4-digit code
              </div>
              <div className="d-flex justify-content-center mb-4">
                {otpValues.map((value, index) => (
                  <input
                    key={index}
                    ref={otpRefs[index]}
                    type="text"
                    className="input_tags_login form-control text-center full-width-important"
                    style={{
                      height: "44px",
                      width: "44px",
                      fontSize: "1.15rem",
                      margin: "0 8px",
                      borderRadius: "8px",
                      border: "1px solid #cbcfd5",
                      background: "#fff",
                    }}
                    value={value}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    maxLength={1}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              <button
                className="btn btn-primary w-100"
                type="submit"
                disabled={loading}
                style={{
                  padding: "14px 0",
                  fontSize: "1.10rem",
                  borderRadius: "10px",
                  background: "#178be2",
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                  boxShadow: "0 1px 4px rgba(44,51,73,0.07)",
                }}
              >
                {loading ? (
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  />
                ) : (
                  "Verify OTP"
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      <nav
        style={{
          display: "flex",
          gap: "34px",
          marginTop: "0px",
          marginBottom: "10px",
          maxWidth: "440px",
          width: "100%",
          justifyContent: "center",
        }}
      >
        <a
          href="#"
          style={{
            color: "#757c8a",
            fontWeight: 450,
            fontSize: "1rem",
            textDecoration: "none",
          }}
        >
          Home
        </a>
        <a
          href="#"
          style={{
            color: "#757c8a",
            fontWeight: 450,
            fontSize: "1rem",
            textDecoration: "none",
          }}
        >
          Book a demo
        </a>
        <a
          href="#"
          style={{
            color: "#757c8a",
            fontWeight: 450,
            fontSize: "1rem",
            textDecoration: "none",
          }}
        >
          Contact
        </a>
        <a
          href="#"
          style={{
            color: "#757c8a",
            fontWeight: 450,
            fontSize: "1rem",
            textDecoration: "none",
          }}
        >
          Support
        </a>
      </nav>

      <Footer />
    </div>
  );
}

export default Login;

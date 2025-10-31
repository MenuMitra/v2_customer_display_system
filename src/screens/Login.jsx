import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { authService } from "../services/authService";
import Footer from "../components/Footer";

function Login() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileValidationMsg, setMobileValidationMsg] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpValues, setOtpValues] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0); // seconds left to allow resend
  const [otpError, setOtpError] = useState(false);
  const [activeOtpIndex, setActiveOtpIndex] = useState(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
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
      const response = await authService.sendOTP(mobileNumber);
      if (response.success) {
        setShowOtpInput(true);
        setOtpValues(["", "", "", ""]);
        setTimer(30);
        setOtpError(false);
      } else {
        setError(response.error || "Failed to send OTP");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
    }
  };

  // countdown effect for resend timer
  useEffect(() => {
    if (!showOtpInput || timer <= 0) return;
    const id = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [showOtpInput, timer]);
  

  // Auto submit when all 4 OTP digits are entered
  useEffect(() => {
    if (!showOtpInput) return;
    const allFilled = otpValues.every((d) => d && d.length === 1);
    if (allFilled && !autoSubmitted) {
      setAutoSubmitted(true);
      handleVerifyOTP({ preventDefault: () => {} });
    }
    if (!allFilled && autoSubmitted) {
      setAutoSubmitted(false);
    }
  }, [showOtpInput, otpValues, autoSubmitted]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);
    if (otpError) setOtpError(false);
    if (value !== "" && index < 3) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return; // prevent early clicks
    setError("");
    setOtpValues(["", "", "", ""]);
    setOtpError(false);
    try {
      const response = await authService.resendOTP(mobileNumber);
      if (response.success) {
        setTimer(30);
      } else {
        setError(response.error || "Failed to resend OTP");
      }
    } catch {
      setError("Failed to resend OTP, please try again.");
    } finally {
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
      const response = await authService.verifyOTP(mobileNumber, otp);
      if (response.success) {
        navigate("/orders");
      } else {
        setError(response.error || "Invalid OTP");
        setOtpError(true);
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
      setOtpError(true);
    } finally {
    }
  };

  const handleBackToLogin = () => {
    setShowOtpInput(false);
    setError("");
    setOtpError(false);
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
        justifyContent: "center"
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
          margin: "11px 0 6px 0"
        }}
      >
        {/* Logo, Title, Subtitle Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%"
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
              marginBottom: "7px"
            }}
          >
            MenuMitra
          </div>
          <div
            style={{
              fontWeight: 600,
              fontSize: "1.50rem",
              textAlign: "center",
              color: "#22242c",
              marginBottom: "20px"
            }}
          >
            Customer Display System
          </div>
          <div
            style={{
              color: "#666b7c",
              fontSize: "1rem",
              textAlign: "center",
              fontWeight: 400,
              marginBottom: "22px"
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
              style={{
                fontSize: "1rem",
                marginBottom: "10px",
                textAlign: "center",
                marginLeft: "60px",
                marginRight: "10px"
              }}
            >
              {error}
            </div>
          )}
          {!showOtpInput && (
            <div style={{ marginBottom: "17px" }}>
              <label
                htmlFor="mobile"
                style={{
                  fontSize: "1.07rem",
                  fontWeight: 400,
                  marginBottom: 6,
                  display: "block",
                  color: "#22242c"
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
                onChange={e => {
                  const sanitized = e.target.value.replace(/\D/g, "").slice(0, 10);
                  if (sanitized.length === 1 && sanitized[0] < '6') {
                    setMobileValidationMsg("Mobile number must start with 6-9");
                    return;
                  }
                  if (mobileValidationMsg) setMobileValidationMsg("");
                  setMobileNumber(sanitized);
                }}
                autoFocus={!showOtpInput}
                disabled={showOtpInput}
                style={{
                  fontSize: "1.08rem",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "0.6px solid #ddd",
                  height: "48px",
                  marginBottom: "12px",
                  background: showOtpInput ? "#f3f4f7" : "#fff",
                  color: showOtpInput ? "#a0a4b0" : "#22242c",
                  transition: "background 0.2s"
                }}
              />
              {mobileValidationMsg && (
                <div style={{ color: '#dc3545', fontSize: '0.95rem', marginTop: '-8px', marginBottom: '8px' }}>
                  {mobileValidationMsg}
                </div>
              )}
              <button
                className="btn btn-primary w-100"
                type="submit"
                disabled={mobileNumber.length !== 10}
                style={{
                  padding: "15px 0",
                  fontSize: "1.11rem",
                  borderRadius: "10px",
                  background: mobileNumber.length === 10 && !loading ? "#178be2" : "#e5e7eb",
                  color: "#fff",
                  border: "none",
                  marginTop: "12px",
                  marginBottom: "0",
                  fontWeight: 600,
                  boxShadow: "0 1px 4px rgba(44,51,73,0.07)"
                }}
              >
                {"Send OTP"}
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
                      minHeight: "50px",
                      maxWidth: "70px",
                      fontSize: "1.15rem",
                      margin: "15px",
                      borderRadius: "8px",
                      border: otpError ? "1px solid #dc3545" : "1px solid #cbcfd5",
                      boxShadow: index === activeOtpIndex && !otpError ? "0 0 0 3px rgba(37, 99, 235, 0.35)" : "0 2px 5px rgba(0, 0, 0, 0.1)",
                      background: "#fff",
                      transition: "box-shadow 0.2s ease"
                    }}
                    value={value}
                    onChange={e => handleOtpChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    onFocus={() => setActiveOtpIndex(index)}
                    onBlur={() => setActiveOtpIndex(prev => (prev === index ? null : prev))}
                    onMouseEnter={() => setActiveOtpIndex(index)}
                    onMouseLeave={() => setActiveOtpIndex(prev => (prev === index ? null : prev))}
                    maxLength={1}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '200px', marginBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={timer > 0}
                    className="text-base font-medium focus:outline-none focus:underline"
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: timer > 0 ? '#9ca3af' : '#2563eb',
                      cursor: timer > 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {timer > 0 ? `Resend OTP (${timer}s)` : "Resend OTP"}
                  </button>
                  <button
                    onClick={handleBackToLogin}
                    type="button"
                    className="text-base font-medium focus:outline-none focus:underline"
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#2563eb' // Always blue color here
                    }}
                  >
                    Back to login
                  </button>
                </div>


              <button
                className="btn btn-primary w-100"
                type="submit"
                disabled={otpValues.some(digit => !digit)}
                style={{
                  padding: "14px 0",
                  fontSize: "1.10rem",
                  borderRadius: "10px",
                  background: "#178be2",
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                  boxShadow: "0 1px 4px rgba(44,51,73,0.07)"
                }}
              >
                {"Verify OTP"}
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
          justifyContent: "center"
        }}
      >
        <a href="https://menumitra.com/" style={{ color: "#757c8a", fontWeight: 450, fontSize: "0.9rem", textDecoration: "none" }}>
          Home
        </a>
        <a href="https://menumitra.com/book-demo" style={{ color: "#757c8a", fontWeight: 450, fontSize: "0.9rem", textDecoration: "none" }}>
          Book a demo
        </a>
        <a href="https://menumitra.com/contact" style={{ color: "#757c8a", fontWeight: 450, fontSize: "0.9rem", textDecoration: "none" }}>
          Contact
        </a>
        <a href="https://menumitra.com/about" style={{ color: "#757c8a", fontWeight: 450, fontSize: "0.9rem", textDecoration: "none" }}>
          Support
        </a>
      </nav>
      <Footer />
    </div>
  );
}

export default Login;

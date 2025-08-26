import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    <>
      <div className="container d-flex align-items-center justify-content-center min-vh-100">
        <div className="card rounded-4 login-card shadow-sm" style={{ maxWidth: "600px", width: "100%" }}>
          {/* Logo */}
          <div className="app-brand justify-content-center mt-5">
            <Link to="/" className="app-brand-link gap-2">
              <span className="app-brand-logo demo">
                <span className="text-primary">
                  <img
                    src={logo}
                    alt="MenuMitra"
                    style={{ width: "50px", height: "50px" }}
                  />
                </span>
              </span>
              <span className="app-brand-text demo text-heading fw-semibold">
                MenuMitra
              </span>
            </Link>
          </div>
          <span className="app-brand-text demo text-heading fw-semibold text-center pt-3" style={{ fontSize: "2rem", fontWeight: "bold", color: "#1a1a1a" }}>
            Customer Display System
          </span>
          {/* /Logo */}
          <div className="card-body pt-5 pb-4">
            <form
              id="formAuthentication"
              className="mb-3 fv-plugins-bootstrap5 fv-plugins-framework"
              onSubmit={showOtpInput ? handleVerifyOTP : handleSendOTP}
              noValidate="novalidate"
            >
              {error && (
                <div className="alert alert-danger mb-3" role="alert" style={{ fontSize: "1rem" }}>
                  {error}
                </div>
              )}
              
              {!showOtpInput ? (
                <div className="form-floating form-floating-outline mb-4">
                  <input
                    type="text"
                    className="form-control"
                    id="mobile"
                    name="mobile"
                    placeholder="Enter your mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    autoFocus
                    style={{ fontSize: "1.2rem", padding: "15px" }}
                  />
                  <label htmlFor="mobile" style={{ fontSize: "1.1rem" }}>Mobile Number</label>
                </div>
              ) : (
                <>
                  <div className="text-center mb-4" style={{ fontSize: "1.1rem" }}>
                    Enter the 4-digit code sent to {mobileNumber}
                  </div>
                  <div className="d-flex justify-content-center gap-3 mb-4">
                    {otpValues.map((value, index) => (
                      <input
                        key={index}
                        ref={otpRefs[index]}
                        type="text"
                        className="form-control text-center"
                        style={{ width: "60px", height: "60px", fontSize: "1.5rem", padding: "10px" }}
                        value={value}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        maxLength={1}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </>
              )}
              
              <div className="mb-4">
                <button
                  className="btn btn-primary d-grid w-100"
                  type="submit"
                  disabled={loading}
                  style={{ padding: "15px", fontSize: "1.2rem" }}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : showOtpInput ? (
                    "Verify OTP"
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </div>
            </form>
            {/* Footer */}
            <Footer />
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
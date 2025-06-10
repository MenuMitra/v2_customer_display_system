import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { authService } from "../services/authService";

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

    // Move to next input if value is entered
    if (value !== "" && index < 3) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
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
        // Navigate to orders page
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
        <div className="card rounded-4" style={{ maxWidth: "800px", height: "400px", width: "100%" }}>
          {/* Logo */}
          <div className="app-brand justify-content-center mt-5">
            <Link to="/" className="app-brand-link gap-3">
              <span className="app-brand-logo demo">
                <span className="text-primary">
                  <img
                    src={logo}
                    alt="MenuMitra"
                    style={{ width: "40px", height: "40px" }}
                  />
                </span>
              </span>
              <span className="app-brand-text demo text-heading fw-semibold">
                MenuMitra
              </span>
            </Link>
          </div>
          <span className="app-brand-text demo text-heading fw-semibold text-center pt-5">
            Customer Display System
          </span>
          {/* /Logo */}
          <div className="card-body pt-4">
            <form
              id="formAuthentication"
              className="mb-5 fv-plugins-bootstrap5 fv-plugins-framework"
              onSubmit={showOtpInput ? handleVerifyOTP : handleSendOTP}
              noValidate="novalidate"
            >
              {error && (
                <div className="alert alert-danger mb-3" role="alert">
                  {error}
                </div>
              )}
              
              {!showOtpInput ? (
                <div className="form-floating form-floating-outline mb-5 form-control-validation fv-plugins-icon-container">
                  <input
                    type="text"
                    className="form-control"
                    id="mobile"
                    name="mobile"
                    placeholder="Enter your mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    autoFocus
                  />
                  <label htmlFor="mobile">Mobile Number</label>
                </div>
              ) : (
                <>
                  <div className="text-center mb-4">
                    Enter the 4-digit code sent to {mobileNumber}
                  </div>
                  <div className="d-flex justify-content-center gap-3 mb-5">
                    {otpValues.map((value, index) => (
                      <input
                        key={index}
                        ref={otpRefs[index]}
                        type="text"
                        className="form-control text-center"
                        style={{ width: "50px", height: "50px" }}
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
              
              <div className="mb-5">
                <button
                  className="btn bg-primary text-white d-grid w-100 waves-effect waves-light"
                  type="submit"
                  disabled={loading}
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

            {/* Footer links */}
            <div className="d-flex flex-column flex-md-row justify-content-center align-items-center gap-4 mt-4 pt-4 pb-5 border-bottom fs-16">
              <Link to="https://menumitra.com/terms_conditions" target="_blank" className="text-secondary">
                Terms and Conditions
              </Link>
              <Link to="https://menumitra.com/privacy_policy" target="_blank" className="text-secondary">
                Privacy Policy
              </Link>
              <Link to="https://menumitra.com/cookie_policy" target="_blank" className="text-secondary">
                Cookie Policy
              </Link>
              <Link to="https://menumitra.com/request_data_removal" target="_blank" className="text-secondary">
                Request Data Removal
              </Link>
            </div>
            
            {/* Social Media Links */}
            <div className="d-flex justify-content-center gap-2 mt-5">
              <a
                href="https://www.facebook.com/people/Menu-Mitra/61565082412478/"
                className="btn btn-icon btn-lg rounded-pill btn-text-facebook waves-effect"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-facebook-f" />
              </a>
              <a
                href="https://www.instagram.com/menumitra/"
                className="btn btn-icon btn-lg rounded-pill btn-text-instagram waves-effect"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-instagram" />
              </a>
              <a
                href="https://www.youtube.com/@menumitra"
                className="btn btn-icon btn-lg rounded-pill btn-text-youtube waves-effect"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-youtube" />
              </a>
              <a
                href="https://x.com/MenuMitra"
                className="btn btn-icon btn-lg rounded-pill btn-text-twitter waves-effect"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-x-twitter" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;

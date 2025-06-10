import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import "./LoginScreen.css";
import logo from "../assets/logo.png";

function LoginScreen() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(10);
  const navigate = useNavigate();
  const [otpValues, setOtpValues] = useState(["", "", "", ""]);
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];

  const isValidMobile = (number) => /^[6-9]\d{9}$/.test(number);

  // Timer effect for OTP expiration
  // useEffect(() => {
  //   let timer;
  //   if (showOtp && timeLeft > 0) {
  //     timer = setInterval(() => {
  //       setTimeLeft((prevTime) => prevTime - 1);
  //     }, 1000);
  //   } else if (timeLeft === 0) {
  //     setShowOtp(false);
  //     setOtpValues(["", "", "", ""]);
  //     setError("OTP expired. Please request a new one.");
  //   }
  //   return () => clearInterval(timer);
  // }, [showOtp, timeLeft]);

  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isValidMobile(mobileNumber)) {
      setError(
        "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9."
      );
      return;
    }

    setLoading(true);
    setTimeLeft(10);

    try {
      const result = await authService.sendOTP(mobileNumber);
      if (result.st === 1) {
        // Allow both CDS and manager roles
        if (result.role === "cds" || result.role === "manager") {
          setShowOtp(true);
        } else {
          setError("Access denied. Only CDS and Manager users can login here.");
        }
      } else {
        setError(result.msg || "Invalid mobile number");
      }
    } catch (err) {
      setError("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (timeLeft === 0) {
      setError("OTP has expired. Please request a new one.");
      setLoading(false);
      return;
    }

    try {
      const result = await authService.verifyOTP(mobileNumber, otp);
      if (result.st === 1) {
        navigate("/orders");
      } else {
        setError(result.msg || "Invalid OTP");
      }
    } catch (err) {
      setError("Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input changes
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;

    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);
    setOtp(newOtpValues.join(""));

    if (value !== "" && index < 3) {
      otpRefs[index + 1].current.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otpValues[index] === "" && index > 0) {
        otpRefs[index - 1].current.focus();
      }
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 4);
    const newOtpValues = [...otpValues];

    pastedData.split("").forEach((char, index) => {
      if (index < 4 && /^\d$/.test(char)) {
        newOtpValues[index] = char;
      }
    });

    setOtpValues(newOtpValues);
    setOtp(newOtpValues.join(""));
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light py-3 py-sm-0">
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-11 col-sm-10 col-md-8 col-lg-6 col-xl-4">
            <div className="card border-0 shadow-lg">
              <div className="card-body p-4 p-lg-5">
                <div className="text-center mb-4">
                  <div className="d-flex justify-content-center align-items-center mb-2">
                    <img
                      src={logo}
                      alt="MenuMitra"
                      className="img-fluid"
                      style={{ maxHeight: "40px" }}
                    />
                    <h2 className="fw-bold text-dark ms-3 mb-0 fs-3 fs-md-2">
                      MenuMitra
                    </h2>
                  </div>
                  <p className="text-muted small mb-0">
                    Customer Display System
                  </p>
                </div>

                {!showOtp ? (
                  <form onSubmit={handleMobileSubmit}>
                    <div className="mb-3 mb-lg-4">
                      <label
                        htmlFor="mobile"
                        className="form-label text-muted fw-semibold small"
                      >
                        Mobile Number
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-white px-3">
                          +91
                        </span>
                        <input
                          type="tel"
                          className={`form-control ${
                            error ? "input-error" : ""
                          }`}
                          id="mobile"
                          value={mobileNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, ""); // Only digits
                            // Only allow if first digit is 6-9, and total length <= 10
                            if (
                              value === "" ||
                              (value[0] >= "6" &&
                                value[0] <= "9" &&
                                value.length <= 10)
                            ) {
                              setMobileNumber(value);
                            }
                          }}
                          maxLength="10"
                          required
                          disabled={loading}
                          placeholder="Enter mobile number"
                          autoFocus
                        />
                      </div>
                      <div style={{ minHeight: "24px" }}>
                        {error && <div className="error-message">{error}</div>}
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary w-100 py-2"
                      disabled={loading || !isValidMobile(mobileNumber)}
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          />
                          Sending OTP...
                        </>
                      ) : (
                        "Send OTP"
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleOtpSubmit}>
                    <div className="mb-3 mb-lg-4">
                      <label className="form-label text-muted fw-semibold small">
                        Enter OTP
                      </label>
                      <div className="d-flex justify-content-center gap-2 gap-sm-3">
                        {[0, 1, 2, 3].map((index) => (
                          <input
                            key={index}
                            ref={otpRefs[index]}
                            type="text"
                            className="form-control text-center fw-bold p-0"
                            value={otpValues[index]}
                            onChange={(e) =>
                              handleOtpChange(
                                index,
                                e.target.value.replace(/\D/g, "")
                              )
                            }
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            maxLength="1"
                            required
                            disabled={loading || timeLeft === 0}
                            autoComplete="off"
                            inputMode="numeric"
                          />
                        ))}
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary w-100 py-2 mb-2"
                      disabled={
                        loading ||
                        otpValues.some((v) => v === "") ||
                        timeLeft === 0
                      }
                    >
                      {loading ? "Verifying..." : "Verify OTP"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-link w-100 text-decoration-none p-2"
                      onClick={() => {
                        setShowOtp(false);
                        setOtpValues(["", "", "", ""]);
                        // setTimeLeft(10);
                      }}
                      disabled={loading}
                    >
                      ← Change Mobile Number
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;

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

  const isMobileReady = mobileNumber.length === 10;
  const isOtpReady = !otpValues.some((digit) => !digit);
  const resendDisabled = timer > 0;

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
    <div className="flex min-h-screen w-screen flex-col items-center justify-center overflow-hidden bg-[#f9fafd]">
      <div className="mb-[6px] mt-[11px] flex w-full max-w-[500px] flex-col items-center rounded-[18px] border-[1.8px] border-[#d1d9e4] bg-white px-[32px] pt-[32px] pb-[28px] shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
        {/* Logo, Title, Subtitle Section */}
        <div className="flex w-full flex-col items-center">
          <img
            src={logo}
            alt="MenuMitra"
            className="mb-[10px] h-[55px] w-[55px] object-contain"
          />
          <div className="mb-[7px] text-center text-[1.5rem] font-semibold text-[#22242c]">
            MenuMitra
          </div>
          <div className="mb-[20px] text-center text-[1.5rem] font-semibold text-[#22242c]">
            Customer Display System
          </div>
          <div className="mb-[22px] text-center text-[1rem] font-normal text-[#666b7c]">
            Sign in to continue to your account
          </div>
        </div>
        <form
          id="formAuthentication"
          onSubmit={showOtpInput ? handleVerifyOTP : handleSendOTP}
          noValidate="novalidate"
          className="w-full"
        >
          {error && (
            <div
              role="alert"
              className="mb-[10px] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-base font-medium text-red-600 ml-[60px] mr-[10px]"
            >
              {error}
            </div>
          )}
          {!showOtpInput && (
            <div className="mb-[17px]">
              <label
                htmlFor="mobile"
                className="mb-[6px] block text-[1.07rem] font-normal text-[#22242c]"
              >
                Mobile Number <span className="text-[#cb1227]">*</span>
              </label>
              <input
                type="text"
                id="mobile"
                name="mobile"
                placeholder="Enter your mobile number"
                value={mobileNumber}
                onChange={(e) => {
                  const sanitized = e.target.value.replace(/\D/g, "").slice(0, 10);
                  if (sanitized.length === 1 && sanitized[0] < "6") {
                    setMobileValidationMsg("Mobile number must start with 6-9");
                    return;
                  }
                  if (mobileValidationMsg) setMobileValidationMsg("");
                  setMobileNumber(sanitized);
                }}
                autoFocus={!showOtpInput}
                disabled={showOtpInput}
                className={`mb-[12px] h-[48px] w-full rounded-3xl border-[0.6px] px-4 text-[1.08rem] transition-colors duration-200 ${
                  showOtpInput
                    ? "border-gray-200 bg-[#f3f4f7] text-[#a0a4b0]"
                    : "border-[#ddd] bg-white text-[#22242c]"
                } focus:border-[#178be2] focus:outline-none focus:ring-2 focus:ring-[#178be2]/20`}
              />
              {mobileValidationMsg && (
                <div className="mt-1 text-sm text-red-600">{mobileValidationMsg}</div>
              )}
              <button
                className={`mt-[12px] flex w-full items-center justify-center rounded-3xl py-[12px] text-[1.11rem] font-semibold text-gray-600 shadow-[0_1px_4px_rgba(44,51,73,0.07)] transition ${
                  isMobileReady && !loading
                    ? "bg-[#178be2]"
                    : "cursor-not-allowed bg-[#e5e7eb]"
                }`}
                type="submit"
                disabled={!isMobileReady}
              >
                {"Send OTP"}
              </button>
            </div>
          )}
          {showOtpInput && (
            <div className="mb-[21px]">
              <div className="mb-3 text-center text-[1rem] font-medium text-[#22242c]">
                Enter the 4-digit code
              </div>
              <div className="mb-4 flex flex-wrap items-center justify-center">
                {otpValues.map((value, index) => {
                  const isActive = activeOtpIndex === index && !otpError;
                  return (
                    <input
                      key={index}
                      ref={otpRefs[index]}
                      type="text"
                      className={`m-[15px] h-[50px] w-[70px] rounded-3xl border bg-white text-center text-[1.15rem] transition focus:outline-none ${
                        otpError ? "border-red-500" : "border-[#cbcfd5]"
                      } ${
                        isActive
                          ? "ring-4 ring-blue-500/40"
                          : "shadow-[0_2px_5px_rgba(0,0,0,0.1)]"
                      }`}
                      value={value}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onFocus={() => setActiveOtpIndex(index)}
                      onBlur={() =>
                        setActiveOtpIndex((prev) => (prev === index ? null : prev))
                      }
                      onMouseEnter={() => setActiveOtpIndex(index)}
                      onMouseLeave={() =>
                        setActiveOtpIndex((prev) => (prev === index ? null : prev))
                      }
                      maxLength={1}
                      autoFocus={index === 0}
                    />
                  );
                })}
              </div>
              <div className="mb-3 flex flex-wrap items-center justify-center gap-[200px]">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendDisabled}
                  className={`text-base rounded-3xl font-medium underline-offset-2 transition ${
                    resendDisabled
                      ? "cursor-not-allowed text-[#9ca3af]"
                      : "text-[#2563eb] hover:underline"
                  }`}
                >
                  {resendDisabled ? `Resend OTP (${timer}s)` : "Resend OTP"}
                </button>
                <button
                  onClick={handleBackToLogin}
                  type="button"
                  className="text-base rounded-3xl font-medium text-[#2563eb] underline-offset-2 hover:underline"
                >
                  Back to login
                </button>
              </div>
              <button
                className={`flex w-full items-center justify-center rounded-3xl py-[14px] text-[1.1rem] font-semibold text-gray-600 shadow-[0_1px_4px_rgba(44,51,73,0.07)] transition ${
                  isOtpReady ? "bg-[#178be2]" : "cursor-not-allowed bg-[#e5e7eb]"
                }`}
                type="submit"
                disabled={!isOtpReady}
              >
                {"Verify OTP"}
              </button>
            </div>
          )}
        </form>
      </div>
      <nav className="mb-[10px] flex w-full max-w-[440px] justify-center gap-[34px] text-[0.9rem] font-[450] text-[#757c8a]">
        <a href="https://menumitra.com/" className="no-underline transition hover:text-[#22242c]">
          Home
        </a>
        <a href="https://menumitra.com/book-demo" className="no-underline transition hover:text-[#22242c]">
          Book a demo
        </a>
        <a href="https://menumitra.com/contact" className="no-underline transition hover:text-[#22242c]">
          Contact
        </a>
        <a href="https://menumitra.com/about" className="no-underline transition hover:text-[#22242c]">
          Support
        </a>
      </nav>
      <Footer />
    </div>
  );
}

export default Login;

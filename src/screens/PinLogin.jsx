import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import { authService } from "../services/authService";
import PinInput from "../components/PinInput";
import { getStoredAuth } from "../utils/cdsApi";

const EMPTY_PIN = ["", "", "", ""];

function PinLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get mobile number from navigation state
  const mobileNumber = location.state?.mobileNumber;
  const role = location.state?.role;

  const [pinValues, setPinValues] = useState(EMPTY_PIN);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [pinError, setPinError] = useState(false);
  const [activePinIndex, setActivePinIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  // Redirect if no mobile number in state
  useEffect(() => {
    if (!mobileNumber) {
      navigate("/login", { replace: true });
      return;
    }

    // Check if already authenticated
    const auth = getStoredAuth();
    if (auth?.access_token) {
      navigate("/orders", { replace: true });
    }
  }, [mobileNumber, navigate]);

  const isPinReady = pinValues.every((d) => d.length === 1);

  const handlePinLogin = useCallback(
    async (e) => {
      e?.preventDefault?.();
      setError("");
      
      if (!mobileNumber) {
        setError("Mobile number is missing. Please start from login.");
        return;
      }

      const pin = pinValues.join("");
      if (pin.length !== 4) {
        setError("Please enter your 4-digit PIN");
        setPinError(true);
        return;
      }

      setLoading(true);
      try {
        const response = await authService.loginWithPin(mobileNumber, pin);
        if (response.success) {
          navigate("/orders", { replace: true });
          return;
        }
        if (response.locked) {
          setError(
            response.error ||
              "Too many failed attempts. Your account is temporarily locked."
          );
          setPinError(true);
          return;
        }
        if (response.requiresPinSetup) {
          setError(response.message || "PIN setup required. Please contact support.");
          setPinError(true);
          return;
        }
        setError(response.error || "Invalid PIN");
        setPinError(true);
      } catch {
        setError("Something went wrong. Please check your connection and try again.");
        setPinError(true);
      } finally {
        setLoading(false);
      }
    },
    [mobileNumber, pinValues, navigate]
  );

  // Auto-submit when all 4 digits are entered
  useEffect(() => {
    const allFilled = pinValues.every((d) => d && d.length === 1);
    if (allFilled && !autoSubmitted && !loading) {
      setAutoSubmitted(true);
      handlePinLogin({ preventDefault: () => {} });
    }
    if (!allFilled && autoSubmitted) {
      setAutoSubmitted(false);
    }
  }, [pinValues, autoSubmitted, loading, handlePinLogin]);

  const handlePinChange = (next) => {
    setPinValues(next);
    if (pinError) setPinError(false);
  };

  const handleBackToLogin = () => {
    navigate("/login", { replace: true });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handlePinLogin(e);
  };

  if (!mobileNumber) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center overflow-hidden bg-[#f9fafd]">
      <div className="mb-[6px] mt-[11px] flex w-full max-w-[500px] flex-col items-center rounded-[18px] border-[1.8px] border-[#d1d9e4] bg-white px-[32px] pt-[32px] pb-[32px] shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
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
            Enter your PIN to sign in
          </div>
        </div>

        <form
          id="formPinAuthentication"
          onSubmit={onSubmit}
          noValidate="novalidate"
          className="w-full"
        >
          {error && (
            <div
              role="alert"
              className="mb-[10px] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-base font-medium text-red-600"
            >
              {error}
            </div>
          )}

          <div className="mb-[21px]">
            <div className="mb-3 text-center text-[1rem] font-medium text-[#22242c]">
              Enter your 4-digit PIN for {mobileNumber}
            </div>
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPin((v) => !v)}
                className="text-sm font-medium text-[#2563eb] hover:underline"
              >
                {showPin ? "Hide PIN" : "Show PIN"}
              </button>
            </div>
            <PinInput
              values={pinValues}
              onChange={handlePinChange}
              pinError={pinError}
              activeIndex={activePinIndex}
              onActiveIndexChange={setActivePinIndex}
              hidden={!showPin}
              autoFocusIndex={0}
            />
            <div className="mb-3 flex justify-center">
              <button
                onClick={handleBackToLogin}
                type="button"
                className="text-base rounded-3xl font-medium text-[#2563eb] underline-offset-2 hover:underline"
              >
                Back to login
              </button>
            </div>
            <button
              className={`flex w-full items-center justify-center rounded-3xl py-[14px] text-[1.1rem] font-semibold text-white shadow-[0_1px_4px_rgba(44,51,73,0.07)] transition ${
                !loading && isPinReady
                  ? "bg-[#1d4ed8]"
                  : "cursor-not-allowed bg-[#6c757d]"
              }`}
              type="submit"
              disabled={loading || !isPinReady}
            >
              {loading ? "Please wait…" : "Sign in"}
            </button>
          </div>
        </form>

        <nav className="w-full border-t border-[#e5e7eb] pt-[24px] pb-[20px]">
          <div className="mb-[20px] flex justify-center gap-[34px] text-[0.9rem] font-[450] text-[#757c8a]">
            <a href="https://menumitra.com/" className="no-underline transition hover:text-[#22242c]">
              Home
            </a>
            <a href="https://menumitra.com/book-demo" className="no-underline transition hover:text-[#22242c]">
              Book a demo
            </a>
            <a href="https://menumitra.com/contact" className="no-underline transition hover:text-[#22242c]">
              Contact
            </a>
            <a href="https://menumitra.com/customer-care" className="no-underline transition hover:text-[#22242c]">
              Support
            </a>
          </div>

          <div className="mb-[16px] flex items-center justify-center gap-[30px]">
            <a
              href="https://menumitra.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[50px] w-[50px] items-center justify-center rounded-full border border-gray-200 bg-[#f8f9fa] text-[2.4rem] text-[#55a845] transition-transform duration-150 hover:-translate-y-0.5 hover:text-[#4285F4]"
              aria-label="Google"
            >
              <i className="ri-google-fill" />
            </a>
            <a
              href="https://www.facebook.com/people/Menu-Mitra/61565082412478/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[50px] w-[50px] items-center justify-center rounded-full border border-gray-200 bg-[#f8f9fa] text-[2.4rem] text-[#3388ff] transition-transform duration-150 hover:-translate-y-0.5 hover:text-[#1877F2]"
              aria-label="Facebook"
            >
              <i className="ri-facebook-fill" />
            </a>
            <a
              href="https://www.instagram.com/menumitra/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[50px] w-[50px] items-center justify-center rounded-full border border-gray-200 bg-[#f8f9fa] text-[2.4rem] text-[#e33161] transition-transform duration-150 hover:-translate-y-0.5 hover:text-[#E4405F]"
              aria-label="Instagram"
            >
              <i className="ri-instagram-fill" />
            </a>
            <a
              href="https://www.youtube.com/@menumitra"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[50px] w-[50px] items-center justify-center rounded-full border border-gray-200 bg-[#f8f9fa] text-[2.4rem] text-[#ee2329] transition-transform duration-150 hover:-translate-y-0.5 hover:text-[#FF0000]"
              aria-label="YouTube"
            >
              <i className="ri-youtube-fill" />
            </a>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-[#757c8a]">
            <span className="font-medium">Version 2.3.0</span>
            <span className="mx-[3px]">|</span>
            <span className="font-normal">17 March 2026</span>
          </div>
        </nav>
      </div>
    </div>
  );
}

export default PinLogin;

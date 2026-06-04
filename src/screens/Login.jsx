import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { authService } from "../services/authService";
import PinInput from "../components/PinInput";
import { getStoredAuth } from "../utils/cdsApi";

const EMPTY_PIN = ["", "", "", ""];

/** @typedef {'signin' | 'pin' | 'otp' | 'create_pin' | 'confirm_pin'} AuthStep */
/** @typedef {'setup' | 'forgot' | null} OtpContext */

function Login() {
  const navigate = useNavigate();

  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileValidationMsg, setMobileValidationMsg] = useState("");
  const [pinValues, setPinValues] = useState(EMPTY_PIN); // Still needed for PIN setup flow
  const [confirmPinValues, setConfirmPinValues] = useState(EMPTY_PIN);
  const [otpValues, setOtpValues] = useState(EMPTY_PIN);
  const [showPin, setShowPin] = useState(false);

  const [step, setStep] = useState(/** @type {AuthStep} */ ("signin"));
  const [otpContext, setOtpContext] = useState(/** @type {OtpContext} */ (null));
  const [setupToken, setSetupToken] = useState(null);

  const [error, setError] = useState("");
  const [pinError, setPinError] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [activePinIndex, setActivePinIndex] = useState(null);
  const [activeOtpIndex, setActiveOtpIndex] = useState(null);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  useEffect(() => {
    const auth = getStoredAuth();
    if (auth?.access_token) {
      navigate("/orders", { replace: true });
    }
  }, [navigate]);

  const isMobileReady = mobileNumber.length === 10;
  const isPinReady = pinValues.every((d) => d.length === 1);
  const isConfirmPinReady = confirmPinValues.every((d) => d.length === 1);
  const isOtpReady = otpValues.every((d) => d.length === 1);
  const resendDisabled = timer > 0;

  const resetPinFields = () => {
    setPinValues(EMPTY_PIN);
    setConfirmPinValues(EMPTY_PIN);
    setPinError(false);
  };

  const goToSignIn = () => {
    setStep("signin");
    setOtpContext(null);
    setSetupToken(null);
    setOtpValues(EMPTY_PIN);
    resetPinFields();
    setError("");
    setOtpError(false);
    setShowPin(false);
    setAutoSubmitted(false);
  };

  const handleMobileContinue = async (e) => {
    e.preventDefault();
    setError("");
    if (!isMobileReady) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const response = await authService.checkMobile(mobileNumber);
      if (!response.success) {
        setError(response.error || "User with this mobile number does not exist");
        return;
      }
      // Navigate to separate PIN screen
      navigate("/pin-login", { 
        state: { 
          mobileNumber,
          role: response.role 
        },
        replace: false
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step !== "otp" || timer <= 0) return;
    const id = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [step, timer]);

  const startOtpFlow = useCallback(
    async (context, infoMessage) => {
      setError(infoMessage || "");
      setOtpContext(context);
      setLoading(true);
      try {
        const response = await authService.requestOtp(mobileNumber);
        if (response.success) {
          setStep("otp");
          setOtpValues(EMPTY_PIN);
          setTimer(30);
          setOtpError(false);
          if (!infoMessage) setError("");
        } else {
          setError(response.error || "Failed to send OTP");
        }
      } catch {
        setError("Failed to send OTP. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [mobileNumber]
  );

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setError("");
    setOtpValues(EMPTY_PIN);
    setOtpError(false);
    setLoading(true);
    try {
      const response = await authService.resendOtp(mobileNumber);
      if (response.success) {
        setTimer(30);
      } else {
        setError(response.error || "Failed to resend OTP");
      }
    } catch {
      setError("Failed to resend OTP, please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = useCallback(
    async (e) => {
      e?.preventDefault?.();
      setError("");
      const otp = otpValues.join("");
      if (otp.length !== 4) {
        setError("Please enter a valid 4-digit OTP");
        return;
      }
      setLoading(true);
      try {
        const response = await authService.verifyOtp(mobileNumber, otp);
        if (!response.success) {
          setError(response.error || "Invalid OTP");
          setOtpError(true);
          return;
        }
        setSetupToken(response.setupToken);
        setStep("create_pin");
        resetPinFields();
        setError("");
      } catch {
        setError("Something went wrong. Please try again.");
        setOtpError(true);
      } finally {
        setLoading(false);
      }
    },
    [mobileNumber, otpValues]
  );

  useEffect(() => {
    if (step !== "otp") return;
    const allFilled = otpValues.every((d) => d && d.length === 1);
    if (allFilled && !autoSubmitted && !loading) {
      setAutoSubmitted(true);
      handleVerifyOtp({ preventDefault: () => {} });
    }
    if (!allFilled && autoSubmitted) {
      setAutoSubmitted(false);
    }
  }, [step, otpValues, autoSubmitted, loading, handleVerifyOtp]);

  const handleCreatePinNext = (e) => {
    e.preventDefault();
    setError("");
    const pin = pinValues.join("");
    if (pin.length !== 4) {
      setError("Please enter a 4-digit PIN");
      setPinError(true);
      return;
    }
    if (pin === "0000" || pin === "1234") {
      setError("Choose a stronger PIN than common patterns");
      setPinError(true);
      return;
    }
    setPinError(false);
    setConfirmPinValues(EMPTY_PIN);
    setStep("confirm_pin");
  };

  const handleConfirmPin = async (e) => {
    e.preventDefault();
    setError("");
    const pin = pinValues.join("");
    const confirm = confirmPinValues.join("");
    if (confirm.length !== 4) {
      setError("Please confirm your 4-digit PIN");
      setPinError(true);
      return;
    }
    if (pin !== confirm) {
      setError("PINs do not match. Please try again.");
      setPinError(true);
      setConfirmPinValues(EMPTY_PIN);
      setStep("create_pin");
      return;
    }

    setLoading(true);
    try {
      const apiCall =
        otpContext === "forgot"
          ? authService.resetPin
          : authService.setupPin;
      const response = await apiCall(
        mobileNumber,
        pin,
        setupToken
      );

      if (!response.success) {
        setError(response.error || "Failed to save PIN");
        setPinError(true);
        return;
      }

      if (response.token ?? response.access_token) {
        navigate("/orders", { replace: true });
        return;
      }

      const loginResponse = await authService.loginWithPin(mobileNumber, pin);
      if (loginResponse.success) {
        navigate("/orders", { replace: true });
      } else {
        setError(loginResponse.error || "PIN saved. Please sign in.");
        goToSignIn();
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setPinError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (next) => {
    setOtpValues(next);
    if (otpError) setOtpError(false);
  };

  const handlePinChange = (next) => {
    setPinValues(next);
    if (pinError) setPinError(false);
  };

  const stepTitle = () => {
    if (step === "pin") return "Enter your 4-digit PIN";
    if (step === "otp") {
      return otpContext === "forgot"
        ? "Verify OTP to reset PIN"
        : "Verify OTP to create PIN";
    }
    if (step === "create_pin") return "Create your 4-digit PIN";
    if (step === "confirm_pin") return "Confirm your PIN";
    return null;
  };

  const primaryButtonLabel = () => {
    if (loading) return "Please wait…";
    if (step === "signin" || step === "pin") return "Sign in";
    if (step === "otp") return "Verify OTP";
    if (step === "create_pin") return "Continue";
    if (step === "confirm_pin") return "Save PIN";
    return "Continue";
  };

  const isPrimaryDisabled = () => {
    if (loading) return true;
    if (step === "signin") return !isMobileReady;
    if (step === "pin") return !isPinReady;
    if (step === "otp") return !isOtpReady;
    if (step === "create_pin") return !isPinReady;
    if (step === "confirm_pin") return !isConfirmPinReady;
    return true;
  };

  const onSubmit = (e) => {
    if (step === "signin") return handleMobileContinue(e);
    if (step === "otp") return handleVerifyOtp(e);
    if (step === "create_pin") return handleCreatePinNext(e);
    if (step === "confirm_pin") return handleConfirmPin(e);
  };

  const showMobileField = step === "signin";
  const showPinScreen = false; // PIN is now on separate route
  const showOtpScreen = step === "otp" || step === "create_pin" || step === "confirm_pin";

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
            Sign in to continue to your account
          </div>
        </div>

        <form
          id="formAuthentication"
          onSubmit={onSubmit}
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

          {showMobileField && (
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
                autoFocus={true}
                className="mb-[12px] h-[48px] w-full rounded-lg border-[0.6px] border-[#ddd] bg-white px-4 text-[1.08rem] text-[#22242c] transition-colors duration-200 focus:border-[#178be2] focus:outline-none focus:ring-2 focus:ring-[#178be2]/20"
              />
              {mobileValidationMsg && (
                <div className="mt-1 text-sm text-red-600">{mobileValidationMsg}</div>
              )}
              <button
                className={`mt-[12px] flex w-full items-center justify-center rounded-3xl py-[12px] text-[1.11rem] font-semibold text-white shadow-[0_1px_4px_rgba(44,51,73,0.07)] transition ${!isPrimaryDisabled()
                    ? "bg-[#1d4ed8]"
                    : "cursor-not-allowed bg-[#6c757d]"
                  }`}
                type="submit"
                disabled={isPrimaryDisabled()}
              >
                {primaryButtonLabel()}
              </button>
            </div>
          )}

          {showOtpScreen && (
            <div className="mb-[21px]">
              {stepTitle() && (
                <div className="mb-3 text-center text-[1rem] font-medium text-[#22242c]">
                  {stepTitle()}
                </div>
              )}

              {step === "otp" && (
                <>
                  <PinInput
                    values={otpValues}
                    onChange={handleOtpChange}
                    pinError={otpError}
                    activeIndex={activeOtpIndex}
                    onActiveIndexChange={setActiveOtpIndex}
                    hidden={false}
                  />
                  <div className="mb-3 flex flex-wrap items-center justify-center gap-[200px]">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendDisabled || loading}
                      className={`text-base rounded-3xl font-medium underline-offset-2 transition ${resendDisabled
                          ? "cursor-not-allowed text-[#9ca3af]"
                          : "text-[#2563eb] hover:underline"
                        }`}
                    >
                      {resendDisabled ? `Resend OTP (${timer}s)` : "Resend OTP"}
                    </button>
                    <button
                      onClick={goToSignIn}
                      type="button"
                      className="text-base rounded-3xl font-medium text-[#2563eb] underline-offset-2 hover:underline"
                    >
                      Back to login
                    </button>
                  </div>
                </>
              )}

              {(step === "create_pin" || step === "confirm_pin") && (
                <>
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
                    values={
                      step === "confirm_pin" ? confirmPinValues : pinValues
                    }
                    onChange={
                      step === "confirm_pin"
                        ? (next) => {
                            setConfirmPinValues(next);
                            if (pinError) setPinError(false);
                          }
                        : handlePinChange
                    }
                    pinError={pinError}
                    activeIndex={activePinIndex}
                    onActiveIndexChange={setActivePinIndex}
                    hidden={!showPin}
                  />
                  {step === "confirm_pin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setStep("create_pin");
                        setConfirmPinValues(EMPTY_PIN);
                        setError("");
                      }}
                      className="mb-3 w-full text-center text-base font-medium text-[#2563eb] hover:underline"
                    >
                      Change PIN
                    </button>
                  )}
                </>
              )}

              <button
                  className={`flex w-full items-center justify-center rounded-3xl py-[14px] text-[1.1rem] font-semibold text-white shadow-[0_1px_4px_rgba(44,51,73,0.07)] transition ${!isPrimaryDisabled()
                      ? "bg-[#1d4ed8]"
                      : "cursor-not-allowed bg-[#6c757d]"
                    }`}
                  type="submit"
                  disabled={isPrimaryDisabled()}
                >
                  {primaryButtonLabel()}
                </button>
            </div>
          )}
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
            <a href="https://menumitra.com/about" className="no-underline transition hover:text-[#22242c]">
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

export default Login;

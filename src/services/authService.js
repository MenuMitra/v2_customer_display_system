import axios from "axios";
import { ENV, CDS_APP_SOURCE } from "../config/apiConfig";
import {
  getOrCreateDeviceId,
  getDeviceModel,
} from "../utils/deviceUtils";

const APP_TYPE = CDS_APP_SOURCE;
const APP_VERSION = "2.3.0";

const basePayload = () => ({
  version: APP_VERSION,
  app_type: APP_TYPE,
  device_id: getOrCreateDeviceId(),
  device_model: getDeviceModel(),
});

/** Payload for v2.3 /verify_pin (matches live API contract). */
const verifyPinPayload = (mobileNumber, pin) => ({
  mobile: mobileNumber,
  pin,
  app_type: APP_TYPE,
  device_id: getOrCreateDeviceId(),
  device_model: getDeviceModel(),
});

const parseErrorMessage = (error, fallback) => {
  const data = error.response?.data;
  if (!data) return fallback;
  if (typeof data.message === "string") return data.message;
  if (typeof data.detail === "string") return data.detail;
  if (data.detail) return JSON.stringify(data.detail);
  return fallback;
};

/** Flatten nested API payloads (e.g. { data: { access_token } }). */
const normalizeAuthResponse = (raw) => {
  if (!raw || typeof raw !== "object") return raw;
  const nested = raw.data ?? raw.result ?? raw.payload;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return { ...raw, ...nested };
  }
  return raw;
};

const extractAuthToken = (raw) => {
  const data = normalizeAuthResponse(raw);
  return (
    data.token ??
    data.access_token ??
    data.accessToken ??
    data.auth_token ??
    null
  );
};

const isExplicitFailure = (data) =>
  data.success === false || data.status === false || data.status === "error";

const generateFcmPlaceholder = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * Normalizes login / verify responses and persists session in localStorage.
 */
export const persistAuthSession = (result, deviceIdOverride = null) => {
  localStorage.removeItem("cds_selected_outlet");

  const accessToken =
    result.token ??
    result.access_token ??
    result.accessToken ??
    null;
  const refreshToken =
    result.refresh_token ?? result.refreshToken ?? null;

  const user = result.user ?? {};
  const resolvedUserId =
    user.id ??
    result.user_id ??
    result.userId ??
    result.staff_id ??
    result.staffId ??
    null;
  const resolvedOwnerId =
    result.owner_id ??
    result.ownerId ??
    result.partner_id ??
    result.partnerId ??
    resolvedUserId;

  const authPayload = {
    name: user.name ?? result.name ?? null,
    mobile: user.mobile ?? result.mobile ?? null,
    user_id: resolvedUserId,
    owner_id: resolvedOwnerId,
    outlet_id: result.outlet_id ?? result.outletId ?? null,
    access_token: accessToken,
    refresh_token: refreshToken,
    role: result.role ?? user.role ?? null,
    app_source: CDS_APP_SOURCE,
    device_id: deviceIdOverride ?? getOrCreateDeviceId(),
    device_token:
      result.device_token ?? result.deviceToken ?? generateFcmPlaceholder(),
    expires_at:
      result.expires_at ??
      result.expiresAt ??
      result.expires_on ??
      result.expiresOn ??
      null,
  };

  localStorage.setItem("authData", JSON.stringify(authPayload));
  return authPayload;
};

export const authService = {
  APP_VERSION,
  APP_TYPE,

  /** Validate mobile — POST /login without pin (returns role when user exists). */
  checkMobile: async (mobileNumber) => {
    try {
      const response = await axios.post(
        `${ENV.V2_COMMON_BASE}/login`,
        {
          mobile: mobileNumber,
          app_type: APP_TYPE,
          device_id: getOrCreateDeviceId(),
          device_model: getDeviceModel(),
        },
        { headers: { "Content-Type": "application/json" } }
      );
      const data = response.data;
      if (data.role || data.success === true) {
        return { success: true, role: data.role, ...data };
      }
      return {
        success: false,
        error: data.message || data.detail || "Mobile number not found",
      };
    } catch (error) {
      console.error("Mobile Check Error:", error);
      return {
        success: false,
        error: parseErrorMessage(error, "Unable to verify mobile number"),
      };
    }
  },

  /** PIN login — POST /v2.3/common/verify_pin */
  loginWithPin: async (mobileNumber, pin) => {
    try {
      const response = await axios.post(
        `${ENV.V2_COMMON_BASE}/verify_pin`,
        verifyPinPayload(mobileNumber, pin),
        { headers: { "Content-Type": "application/json" } }
      );

      const data = normalizeAuthResponse({
        ...response.data,
        mobile: response.data.mobile ?? mobileNumber,
      });

      if (isExplicitFailure(data)) {
        return {
          success: false,
          error: data.message || "Invalid PIN",
          locked: Boolean(data.locked ?? data.account_locked),
          attemptsRemaining: data.attempts_remaining,
          requiresPinSetup: Boolean(data.requires_pin_setup ?? data.pin_not_set),
        };
      }

      if (data.requires_pin_setup || data.pin_not_set) {
        return {
          success: false,
          requiresPinSetup: true,
          message: data.message || "Please set up your PIN",
        };
      }

      const token = extractAuthToken(data);
      if (!token) {
        return {
          success: false,
          error:
            data.message ||
            data.detail ||
            "Login succeeded but no session token was returned.",
        };
      }

      persistAuthSession(data);
      return {
        success: true,
        access_token: token,
        ...data,
      };
    } catch (error) {
      console.error("PIN Login Error:", error);
      const status = error.response?.status;
      const data = normalizeAuthResponse(error.response?.data ?? {});

      if (status === 423 || data.locked || data.account_locked) {
        return {
          success: false,
          locked: true,
          error:
            data.message ||
            "Account temporarily locked. Try again later.",
        };
      }

      if (data.requires_pin_setup || data.pin_not_set) {
        return {
          success: false,
          requiresPinSetup: true,
          message: data.message || "Please set up your PIN",
        };
      }

      return {
        success: false,
        error: parseErrorMessage(error, "Invalid PIN"),
        attemptsRemaining: data.attempts_remaining,
      };
    }
  },

  /** Request OTP (first-time PIN setup, forgot PIN, or legacy flow) */
  requestOtp: async (mobileNumber) => {
    try {
      const response = await axios.post(
        `${ENV.V2_COMMON_BASE}/login`,
        {
          mobile: mobileNumber,
          ...basePayload(),
        },
        { headers: { "Content-Type": "application/json" } }
      );
      return {
        success: true,
        role: response.data.role,
        message: response.data.detail ?? response.data.message,
      };
    } catch (error) {
      console.error("OTP Request Error:", error);
      return {
        success: false,
        error: parseErrorMessage(error, "Failed to send OTP"),
      };
    }
  },

  resendOtp: async (mobileNumber) => authService.requestOtp(mobileNumber),

  /** Verify OTP before PIN setup or reset */
  verifyOtp: async (mobileNumber, otp) => {
    const fcmToken = generateFcmPlaceholder();
    const deviceId = getOrCreateDeviceId();

    try {
      const response = await axios.post(
        `${ENV.V2_COMMON_BASE}/verify_otp`,
        {
          mobile: mobileNumber,
          otp,
          device_id: deviceId,
          device_model: getDeviceModel(),
          fcm_token: fcmToken,
          app_type: APP_TYPE,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const result = response.data;
      const setupToken =
        result.pin_setup_token ??
        result.setup_token ??
        result.access_token ??
        result.token ??
        null;

      return {
        success: true,
        setupToken,
        role: result.role,
        name: result.name,
        ...result,
      };
    } catch (error) {
      console.error("OTP Verification Error:", error);
      return {
        success: false,
        error: parseErrorMessage(error, "Invalid OTP"),
      };
    }
  },

  /** Create PIN after OTP verification (first-time login) */
  setupPin: async (mobileNumber, pin, setupToken) => {
    try {
      const response = await axios.post(
        `${ENV.V2_COMMON_BASE}/setup_pin`,
        {
          mobile: mobileNumber,
          pin,
          setup_token: setupToken,
          ...basePayload(),
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const data = response.data;
      if (data.success === false) {
        return {
          success: false,
          error: data.message || "Failed to set PIN",
        };
      }

      if (data.token ?? data.access_token) {
        persistAuthSession(data);
      }

      return { success: true, ...data };
    } catch (error) {
      console.error("PIN Setup Error:", error);
      return {
        success: false,
        error: parseErrorMessage(error, "Failed to set PIN"),
      };
    }
  },

  /** Reset PIN after forgot-PIN OTP verification */
  resetPin: async (mobileNumber, pin, setupToken) => {
    try {
      const response = await axios.post(
        `${ENV.V2_COMMON_BASE}/reset_pin`,
        {
          mobile: mobileNumber,
          pin,
          setup_token: setupToken,
          ...basePayload(),
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const data = response.data;
      if (data.success === false) {
        return {
          success: false,
          error: data.message || "Failed to reset PIN",
        };
      }

      if (data.token ?? data.access_token) {
        persistAuthSession(data);
      }

      return { success: true, ...data };
    } catch (error) {
      console.error("PIN Reset Error:", error);
      return {
        success: false,
        error: parseErrorMessage(error, "Failed to reset PIN"),
      };
    }
  },

  refreshAccessToken: async () => {
    try {
      const raw = localStorage.getItem("authData");
      if (!raw) return { success: false, error: "Not authenticated" };

      const auth = JSON.parse(raw);
      const refreshToken = auth.refresh_token;
      if (!refreshToken) return { success: false, error: "No refresh token" };

      const response = await axios.post(
        `${ENV.V2_COMMON_BASE}/refresh_token`,
        {
          refresh_token: refreshToken,
          ...basePayload(),
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const data = response.data;
      persistAuthSession({ ...auth, ...data });
      return { success: true };
    } catch (error) {
      console.error("Token Refresh Error:", error);
      return { success: false, error: parseErrorMessage(error, "Session expired") };
    }
  },

  logout: () => {
    localStorage.removeItem("authData");
    localStorage.removeItem("cds_selected_outlet");
    window.dispatchEvent(new CustomEvent("logout"));
  },

  // Backward-compatible aliases
  sendOTP: (mobile) => authService.requestOtp(mobile),
  resendOTP: (mobile) => authService.resendOtp(mobile),
  verifyOTP: (mobile, otp) => authService.verifyOtp(mobile, otp),
};

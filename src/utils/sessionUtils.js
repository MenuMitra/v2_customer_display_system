// Utility functions for session management
import { authService } from "../services/authService";

const AUTH_DATA_KEY = "authData";

export const getAuthData = () => {
  try {
    const raw = localStorage.getItem(AUTH_DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const isAccessTokenExpired = (authData) => {
  const raw = authData?.expires_at ?? authData?.expires_on;
  if (!raw) return false;

  const expires = new Date(raw);
  if (!Number.isFinite(expires.getTime())) {
    return false;
  }

  return expires <= new Date();
};

/**
 * Handles session expiration by clearing localStorage and redirecting to login
 */
export const handleSessionExpired = () => {
  const deviceId = localStorage.getItem("cds_device_id");
  const rememberedMobile = localStorage.getItem("cds_remember_mobile");

  localStorage.removeItem(AUTH_DATA_KEY);
  localStorage.removeItem("cds_selected_outlet");

  if (deviceId) localStorage.setItem("cds_device_id", deviceId);
  if (rememberedMobile) {
    localStorage.setItem("cds_remember_mobile", rememberedMobile);
  }

  window.dispatchEvent(new CustomEvent("logout"));
  window.location.href = "/login";
};

/**
 * Checks if an error is a session expiration error (401)
 * @param {Object} error - The error object from axios
 * @returns {boolean} - True if it's a session expiration error
 */
export const isSessionExpiredError = (error) => {
  if (!error.response || error.response.status !== 401) {
    return false;
  }

  const errorMessage =
    error.response?.data?.detail ||
    error.response?.data?.message ||
    "";
  const lower = errorMessage.toLowerCase();
  return (
    lower.includes("invalid or inactive session") ||
    lower.includes("error with token") ||
    lower.includes("session expired") ||
    lower.includes("invalid token")
  );
};

/**
 * Attempts refresh when access token is expired but refresh_token exists.
 * @returns {Promise<boolean>} true if session is still valid
 */
export const ensureValidSession = async () => {
  const auth = getAuthData();
  if (!auth?.access_token) return false;
  if (!isAccessTokenExpired(auth)) return true;
  if (!auth.refresh_token) return true;

  const refreshed = await authService.refreshAccessToken();
  return refreshed.success;
};

/**
 * Returns true when an axios error indicates an expired/invalid session.
 * Does not clear storage or redirect — callers decide how to handle UI.
 */
export const handleApiError = (error) => isSessionExpiredError(error);

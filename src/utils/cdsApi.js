import { CDS_APP_SOURCE } from "../config/apiConfig";
import { handleSessionExpired } from "./sessionUtils";

export const getStoredAuth = () => {
  try {
    const raw = localStorage.getItem("authData");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getBearerHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

/** Must match app_type used at PIN login (verify_pin). */
export const getOutletListPayload = (ownerId) => ({
  owner_id: String(ownerId ?? ""),
  app_source: CDS_APP_SOURCE,
  outlet_id: 0,
});

export const getCdsOrderListPayload = ({
  outletId,
  ownerId,
  dateFilter = "today",
}) => ({
  outlet_id: Number(outletId),
  date_filter: dateFilter,
  owner_id: Number(ownerId),
  app_source: CDS_APP_SOURCE,
});

export const isSessionExpiredMessage = (text = "") => {
  const msg = String(text).toLowerCase();
  return (
    msg.includes("invalid or inactive session") ||
    msg.includes("error with token") ||
    msg.includes("invalid token") ||
    msg.includes("session expired")
  );
};

export const getJsonSessionError = (data, httpStatus = 200) => {
  const message = data?.message || data?.detail || "";
  if (httpStatus === 401 && message) {
    return isSessionExpiredMessage(message) ? message : "Unauthorized";
  }
  if (data?.success === false && isSessionExpiredMessage(message)) {
    return message;
  }
  return null;
};

/**
 * Returns session error message if response indicates invalid token.
 * Does not log the user out unless `logoutOnSessionError` is true.
 */
export const checkApiSessionError = (
  data,
  httpStatus = 200,
  { logoutOnSessionError = false } = {}
) => {
  const sessionError = getJsonSessionError(data, httpStatus);
  if (!sessionError) return null;

  if (logoutOnSessionError) {
    handleSessionExpired();
  }

  return sessionError;
};

/** @deprecated Use checkApiSessionError */
export const handleFetchSessionError = async (
  response,
  options = {}
) => {
  const data = await response.json().catch(() => ({}));
  return checkApiSessionError(data, response.status, options);
};

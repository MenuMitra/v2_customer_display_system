const DEVICE_ID_KEY = "cds_device_id";
const REMEMBER_MOBILE_KEY = "cds_remember_mobile";

export const getOrCreateDeviceId = () => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

export const getDeviceModel = () => {
  if (typeof navigator === "undefined") return "Web Browser";
  const vendor = navigator.vendor?.trim();
  if (vendor) return vendor.slice(0, 80);
  const ua = navigator.userAgent || "";
  return ua ? ua.slice(0, 80) : "Web Browser";
};

export const getRememberedMobile = () =>
  localStorage.getItem(REMEMBER_MOBILE_KEY) || "";

export const setRememberedMobile = (mobile, remember) => {
  if (remember && mobile) {
    localStorage.setItem(REMEMBER_MOBILE_KEY, mobile);
  } else {
    localStorage.removeItem(REMEMBER_MOBILE_KEY);
  }
};

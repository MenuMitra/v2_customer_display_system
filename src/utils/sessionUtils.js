// Utility functions for session management

/**
 * Handles session expiration by clearing localStorage and redirecting to login
 */
export const handleSessionExpired = () => {
  // Clear all local storage
  localStorage.clear();
  
  // Dispatch logout event for any components listening
  window.dispatchEvent(new CustomEvent('logout'));
  
  // Redirect to login page
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
  
  const errorMessage = error.response?.data?.detail || "";
  return errorMessage.includes("Invalid or inactive session") || 
         errorMessage.includes("401") ||
         error.response.status === 401;
};

/**
 * Handles API errors and redirects to login if session is expired
 * @param {Object} error - The error object from axios
 * @param {Function} navigate - React Router navigate function (optional)
 */
export const handleApiError = (error, navigate = null) => {
  if (isSessionExpiredError(error)) {
    handleSessionExpired();
    return true; // Indicates session was expired
  }
  return false; // Not a session expiration error
};

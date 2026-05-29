import React from "react";
import { Navigate } from "react-router-dom";
import { getAuthData } from "../utils/sessionUtils";

const ProtectedRoute = ({ children }) => {
  const auth = getAuthData();
  const hasToken =
    typeof auth?.access_token === "string" && auth.access_token.length > 0;

  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Check if user is authenticated by looking for authData in localStorage
  const isAuthenticated = () => {
    try {
      const authData = localStorage.getItem('authData');
      if (!authData) return false;
      
      const parsedAuthData = JSON.parse(authData);
      // Check if we have a valid access token
      return parsedAuthData && parsedAuthData.access_token;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  };

  // If not authenticated, redirect to login
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the protected component
  return children;
};

export default ProtectedRoute;

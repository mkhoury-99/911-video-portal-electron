import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * PublicRoute component that redirects authenticated users away from
 * public routes like login and OTP verification
 */
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  const location = window.location.pathname;

  // Special case: Allow access to OTP page even when authenticated but without a role
  // This handles the flow from login -> OTP verification
  if (location === "/otp" && user && !user.user_type) {
    return children;
  }

  // If user is authenticated, redirect to appropriate dashboard
  if (user) {
    // Determine where to redirect based on user role
    let userRole = user.user_type;

    // Redirect based on role
    switch (userRole) {
      case "interpreter":
        return <Navigate to="/" replace />;
      case "customer":
      case "client":
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  // If not authenticated, show the requested public route
  return children;
};

export default PublicRoute;

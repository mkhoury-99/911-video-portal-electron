import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * ProtectedRoute component that checks if user is authenticated
 * and has the required role(s) before rendering the children
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, hasRole } = useAuth();
  const location = useLocation();

  // If user is not authenticated (no user object), redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If allowedRoles is empty, allow any authenticated user
  if (allowedRoles.length === 0) {
    return children;
  }

  // If user doesn't have the required role, redirect to a forbidden page or dashboard
  if (!hasRole(allowedRoles)) {
    // Redirect to a role-specific default page or a forbidden page
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and has the required role
  return children;
};

export default ProtectedRoute;

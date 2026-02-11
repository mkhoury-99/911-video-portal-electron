import React, { useEffect } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

/**
 * RoleBasedRedirect component that redirects users to their appropriate
 * dashboard based on their role after successful authentication
 */
const RoleBasedRedirect = () => {
  const { user } = useAuth();

  // If not authenticated (no user object), redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Get the user role, handling the case where it might be stored as individual characters
  let userRole = user.user_type;

  // If role is not defined but we have characters (0, 1, 2, etc.), reconstruct the role
  if (!userRole && typeof user === "object") {
    // Check if user object has sequential numeric keys (0, 1, 2, etc.)
    const possibleRoleChars = Object.keys(user)
      .filter((key) => !isNaN(parseInt(key)))
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((key) => user[key]);

    if (possibleRoleChars.length > 0) {
      userRole = possibleRoleChars.join("");
    }
  }

  // Redirect based on user role
  switch (userRole) {
    case "interpreter":
      return <Navigate to="/" replace />;
    default:
      return <Navigate to="/unauthorized" replace />;
  }
};

export default RoleBasedRedirect;

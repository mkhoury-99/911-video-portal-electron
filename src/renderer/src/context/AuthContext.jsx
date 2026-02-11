import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data
    const storedToken = sessionStorage.getItem("token");

    if (storedToken) {
      try {
        setUser(storedToken);
      } catch (e) {
        console.error("Failed to parse stored token", e);
        sessionStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const login = (authData) => {
    const userData = {
      ...authData,
      user_type: authData.user_type || "customer",
    };
    setUser(userData);
    sessionStorage.setItem("token", authData.token);
    sessionStorage.setItem("customer_name", authData.customer_name);
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("customer_name");
  };

  const hasRole = (roles) => {
    if (!user || !roles || roles.length === 0) return true;
    return roles.includes(user.user_type);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

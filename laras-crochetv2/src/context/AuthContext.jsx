/* TIP: this is a customer-facing auth context — separate on purpose
   from the admin login built in the backend. A customer signing in
   to check their orders and an admin managing products are different
   concepts with different permissions, so keeping them as separate
   systems (separate models on the backend, separate context here)
   avoids a confusing "is this an admin or a customer?" check
   scattered through the app later. */
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // TIP: lazy initializer — only reads localStorage once, on first
  // mount, not on every render.
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("laras-user")) || null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(
    () => localStorage.getItem("laras-token") || null,
  );

  useEffect(() => {
    if (user && token) {
      localStorage.setItem("laras-user", JSON.stringify(user));
      localStorage.setItem("laras-token", token);
    } else {
      localStorage.removeItem("laras-user");
      localStorage.removeItem("laras-token");
    }
  }, [user, token]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  // TIP: for updating fields on the already-signed-in user (e.g. after
  // editing the username) without touching the token or re-running login.
  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isSignedIn: !!user,
        loading: false,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within an AuthProvider");
  return value;
}

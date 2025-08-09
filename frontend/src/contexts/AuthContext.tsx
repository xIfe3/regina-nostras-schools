import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { authAPI } from "../services/api";
import type { User } from "../services/api";

/**
 * Authentication Context Interface
 * Provides comprehensive authentication state and methods
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom hook to access authentication context
 * Throws error if used outside AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * Manages authentication state, token handling, and user session
 * Includes automatic token refresh and secure storage practices
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Initialize authentication on app start
   * Loads cached user data first, then validates with server
   */
  const initializeAuth = async () => {
    try {
      // First, try to load cached user data for immediate UI state
      const token = localStorage.getItem("auth_token");
      const storedUserData = localStorage.getItem("user_data");

      if (token && storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          setUser(userData);
          console.log("Loaded cached user data");
        } catch (parseError) {
          console.warn("Failed to parse stored user data:", parseError);
          localStorage.removeItem("user_data");
        }
      }

      // Then validate and refresh from server
      await checkAuthStatus();
    } catch (error) {
      console.error("Failed to initialize auth:", error);
      setLoading(false);
    }
  };

  /**
   * Check authentication status on app initialization
   * Validates stored token and fetches current user data
   * Gracefully handles network errors to prevent unnecessary logouts
   */
  const checkAuthStatus = async () => {
    try {
      setError(null);
      const token = localStorage.getItem("auth_token");

      if (!token) {
        setLoading(false);
        return;
      }

      // Validate token format (basic check)
      if (!token.startsWith("eyJ")) {
        console.warn("Invalid token format detected, clearing authentication");
        clearAuthData();
        setLoading(false);
        return;
      }

      // Try to get stored user data first (offline fallback)
      const storedUserData = localStorage.getItem("user_data");
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          setUser(userData);
        } catch (parseError) {
          console.warn("Failed to parse stored user data:", parseError);
        }
      }

      // Attempt to refresh user data from server
      const response = await authAPI.getMe();
      if (response.data.success && response.data.data) {
        setUser(response.data.data);
        // Update stored user data with fresh data
        localStorage.setItem("user_data", JSON.stringify(response.data.data));
      } else {
        throw new Error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Auth check failed:", error);

      // Check if this is a network error or server unavailable
      const isNetworkError =
        error instanceof Error &&
        (error.message.includes("Network error") ||
          error.message.includes("timeout") ||
          error.message.includes("ECONNREFUSED") ||
          !error.message.includes("401"));

      if (isNetworkError) {
        // For network errors, keep user logged in but show warning
        console.warn("Network error during auth check, keeping user logged in");
        setError("Connection error. Some features may be unavailable.");

        // Try to use cached user data if available
        const storedUserData = localStorage.getItem("user_data");
        if (storedUserData && !user) {
          try {
            const userData = JSON.parse(storedUserData);
            setUser(userData);
          } catch (parseError) {
            console.warn("Failed to parse stored user data:", parseError);
          }
        }
      } else {
        // For authentication errors (401, invalid credentials), clear data
        console.warn("Authentication error, clearing user data");
        setError("Authentication failed. Please login again.");
        clearAuthData();
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * User login function with comprehensive error handling
   * @param email - User email address
   * @param password - User password
   */
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // Basic input validation
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      const response = await authAPI.login({ email, password });

      if (response.data.success) {
        const { token, user: userData } = response.data;

        // Validate response data
        if (!token || !userData) {
          throw new Error("Invalid login response");
        }

        // Store authentication data securely
        localStorage.setItem("auth_token", token);
        localStorage.setItem("user_data", JSON.stringify(userData));

        setUser(userData);
      } else {
        throw new Error(response.data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : "Login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh authentication data from server
   * Useful for keeping user data in sync
   */
  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  /**
   * Clear authentication data from storage
   */
  const clearAuthData = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    setUser(null);
  };

  /**
   * User logout function
   * Clears all authentication data and redirects to login
   */
  const logout = () => {
    clearAuthData();
    setError(null);
    // Optionally redirect to login page
    window.location.href = "/login";
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    refreshAuth,
    clearError,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isStudent: user?.role === "student",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Reset Password Component
 * Allows users to reset their password using a valid reset token
 * Provides secure password reset functionality with validation
 */
const ResetPassword: React.FC = () => {
  const { resetToken } = useParams<{ resetToken: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Validate reset token on component mount
    if (!resetToken) {
      setTokenValid(false);
      return;
    }

    // Basic token format validation (should be 40 characters hex)
    const tokenRegex = /^[a-f0-9]{40}$/i;
    if (!tokenRegex.test(resetToken)) {
      setTokenValid(false);
      return;
    }

    setTokenValid(true);
  }, [resetToken]);

  /**
   * Validate password requirements
   */
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

    if (password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    return errors;
  };

  /**
   * Handle form input changes
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  /**
   * Validate form before submission
   */
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        newErrors.password = passwordErrors[0]; // Show first error
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle password reset form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.resetPassword(resetToken!, {
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      // Store the token and user data
      if (response.data.token && response.data.user) {
        localStorage.setItem("auth_token", response.data.token);
        localStorage.setItem("user_data", JSON.stringify(response.data.user));
      }

      toast.success("Password reset successful! Redirecting to dashboard...");

      // Navigate based on user role
      setTimeout(() => {
        if (response.data.user?.role === "admin") {
          navigate("/admin/dashboard");
        } else if (response.data.user?.role === "student") {
          navigate("/student/dashboard");
        } else {
          navigate("/dashboard");
        }
      }, 1500);
    } catch (error: any) {
      console.error("Reset password error:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Failed to reset password. Please try again.";

      if (errorMessage.includes("Invalid or expired")) {
        setTokenValid(false);
      }

      toast.error(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render invalid token state
   */
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Invalid Reset Link
            </h2>

            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired. Please request
              a new password reset.
            </p>

            <div className="space-y-3">
              <Link
                to="/forgot-password"
                className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium
                         hover:bg-blue-700 transition-colors duration-200"
              >
                Request New Reset Link
              </Link>

              <Link
                to="/login"
                className="block w-full text-center text-blue-600 py-3 px-4 rounded-lg
                         border border-blue-600 font-medium hover:bg-blue-50
                         transition-colors duration-200"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render loading state while validating token
   */
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Validating reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Reset Your Password
          </h2>

          <p className="text-gray-600">
            Please enter your new password below. Make sure it's strong and
            secure.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2
                           focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200
                           ${
                             errors.password
                               ? "border-red-500"
                               : "border-gray-300"
                           }`}
                placeholder="Enter your new password"
                disabled={loading}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500
                         hover:text-gray-700 transition-colors duration-200"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 mt-1">{errors.password}</p>
            )}

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-2">
                <div className="text-xs text-gray-600 mb-1">
                  Password requirements:
                </div>
                <div className="space-y-1">
                  {[
                    {
                      test: formData.password.length >= 6,
                      text: "At least 6 characters",
                    },
                    {
                      test: /(?=.*[a-z])/.test(formData.password),
                      text: "One lowercase letter",
                    },
                    {
                      test: /(?=.*[A-Z])/.test(formData.password),
                      text: "One uppercase letter",
                    },
                    {
                      test: /(?=.*\d)/.test(formData.password),
                      text: "One number",
                    },
                  ].map((req, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle
                        className={`w-3 h-3 ${
                          req.test ? "text-green-500" : "text-gray-300"
                        }`}
                      />
                      <span
                        className={`text-xs ${
                          req.test ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2
                           focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200
                           ${
                             errors.confirmPassword
                               ? "border-red-500"
                               : "border-gray-300"
                           }`}
                placeholder="Confirm your new password"
                disabled={loading}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500
                         hover:text-gray-700 transition-colors duration-200"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-600 mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* General Error Message */}
          {errors.general && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{errors.general}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium
                     hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Resetting Password...</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                <span>Reset Password</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700
                     font-medium transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

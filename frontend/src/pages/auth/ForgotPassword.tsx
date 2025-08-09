import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../../services/api";

/**
 * Forgot Password Component
 * Allows users to request a password reset email
 * Provides secure token-based password reset functionality
 */
const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  /**
   * Handle forgot password form submission
   * Validates email and sends reset request to backend
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authAPI.forgotPassword(email);

      setEmailSent(true);
      toast.success("Password reset email sent successfully!");
    } catch (error: any) {
      console.error("Forgot password error:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Failed to send reset email. Please try again.";

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset form to allow trying again
   */
  const handleTryAgain = () => {
    setEmailSent(false);
    setEmail("");
    setError("");
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Check Your Email
            </h2>

            <p className="text-gray-600 mb-6">
              We've sent a password reset link to:
            </p>

            <p className="text-blue-600 font-semibold mb-6 break-words">
              {email}
            </p>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700">
                <strong>Important:</strong> The reset link will expire in 10
                minutes. Please check your spam folder if you don't see the
                email.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleTryAgain}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium
                         hover:bg-blue-700 transition-colors duration-200"
              >
                Send Another Email
              </button>

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Forgot Password?
          </h2>

          <p className="text-gray-600">
            No worries! Enter your email address and we'll send you a link to
            reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(""); // Clear error when user types
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2
                       focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              placeholder="Enter your email address"
              disabled={loading}
              autoComplete="email"
              required
            />
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
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
                <span>Sending Reset Email...</span>
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                <span>Send Reset Email</span>
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

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Having trouble? Contact{" "}
            <a
              href="mailto:admin@reginanostraschools.com"
              className="text-blue-600 hover:text-blue-700"
            >
              admin@reginanostraschools.com
            </a>{" "}
            for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

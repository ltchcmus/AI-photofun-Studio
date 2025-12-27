import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "../../../hooks/use-toast";
import { useAuth } from "../../../hooks/useAuth";

/**
 * Format registration errors into user-friendly messages
 * Maps error codes and technical messages to clear, actionable messages
 */
const formatRegistrationError = (error) => {
  // Extract error data from various response formats
  const errorData = error?.response?.data || error?.data || error;
  const code = errorData?.code;
  const message = errorData?.message || error?.message;
  const status = error?.response?.status || error?.status;

  // Map error codes to user-friendly messages
  const errorCodeMessages = {
    // Registration specific errors
    1027: "You have exceeded the registration limit. Please try again later or contact our support team for assistance.",
    1001: "This username is already taken. Please choose a different username.",
    1002: "This email address is already registered. Try logging in or use a different email.",
    1003: "Invalid email format. Please enter a valid email address.",
    1004: "Password is too weak. Please use at least 8 characters with letters and numbers.",
    1005: "Username must be between 3-50 characters and contain only letters, numbers, and underscores.",
    1006: "Full name is required. Please enter your full name.",
    1007: "Password and confirmation password do not match.",
    1008: "Registration is temporarily disabled. Please try again later.",
    1009: "Invalid registration data. Please check your information and try again.",

    // General authentication errors
    1010: "Session expired. Please refresh the page and try again.",
    1011: "Account verification required. Please check your email.",
    1012: "This account has been suspended. Please contact support.",
  };

  // Check for known error codes
  if (code && errorCodeMessages[code]) {
    return errorCodeMessages[code];
  }

  // Handle HTTP status codes
  if (status === 429 || message?.toLowerCase().includes('rate limit') || message?.toLowerCase().includes('too many')) {
    return "Too many registration attempts. Please wait a few minutes before trying again.";
  }

  if (status === 503 || status === 502) {
    return "Our service is temporarily unavailable. Please try again in a few minutes.";
  }

  if (status === 500) {
    return "Something went wrong on our end. Please try again later or contact support if the issue persists.";
  }

  if (status === 400) {
    // Try to extract meaningful message from 400 errors
    if (message && !message.includes('code') && message.length < 200) {
      return message;
    }
    return "Invalid registration information. Please check your details and try again.";
  }

  // Handle network errors
  if (error?.code === 'ERR_NETWORK' || message?.includes('Network Error')) {
    return "Unable to connect to our servers. Please check your internet connection and try again.";
  }

  // Handle timeout errors
  if (error?.code === 'ECONNABORTED' || message?.includes('timeout')) {
    return "The request timed out. Please check your connection and try again.";
  }

  // If we have a clean, user-friendly message from the server, use it
  if (message && typeof message === 'string' && message.length < 200) {
    // Filter out technical-looking messages
    const technicalPatterns = [
      /error\s*code/i,
      /exception/i,
      /stack\s*trace/i,
      /null\s*pointer/i,
      /undefined/i,
      /^\{.*\}$/,  // JSON-like strings
      /^\[.*\]$/,  // Array-like strings
    ];

    const isTechnical = technicalPatterns.some(pattern => pattern.test(message));

    if (!isTechnical) {
      return message;
    }
  }

  // Default fallback message
  return "Registration failed. Please check your information and try again. If the problem continues, contact our support team.";
};

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    fullname: "",
    email: "",
    password: "",
    confirmpass: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register: registerUser } = useAuth();

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmpass) {
      setError("Confirmation password does not match!");
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        username: formData.username,
        password: formData.password,
        confirmPass: formData.confirmpass,
        email: formData.email,
        fullName: formData.fullname,
        roles: ["USER"],
      });
      toast.success(
        "Đăng ký thành công! Vui lòng đăng nhập."
      );
      navigate("/login");
    } catch (err) {
      const msg = formatRegistrationError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = () => {
    // Get Google OAuth config from environment variables
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      "424511485278-d36bocf4e3avqsadguauellt3gn4l412.apps.googleusercontent.com";

    // Redirect to backend authentication endpoint
    const redirectUri =
      import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
      "http://localhost:8000/identity/auth/authentication";

    // Build Google OAuth2 authorization URL
    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent("openid email profile")}&` +
      `access_type=offline&` +
      `prompt=consent`;

    // Redirect to Google OAuth
    window.location.href = googleAuthUrl;
  };



  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white p-5 overflow-auto">
      <div className="w-full max-w-md mx-auto my-5">
        <div className="bg-white rounded-3xl px-10 py-12 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {/* Translated */}
              Sign Up
            </h1>
            <p className="text-gray-500 text-sm m-0">
              {/* Translated */}
              Create your new account
            </p>
          </div>

          {/* Form */}
          <div className="mb-6">
            {/* Username */}
            <div className="mb-[18px]">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                // Translated
                placeholder="Enter username"
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm transition-all duration-300 outline-none focus:border-black focus:ring-4 focus:ring-black/10"
              />
            </div>

            {/* Full Name */}
            <div className="mb-[18px]">
              <input
                type="text"
                name="fullname"
                value={formData.fullname}
                onChange={handleChange}
                // Translated
                placeholder="Enter your full name"
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm transition-all duration-300 outline-none focus:border-black focus:ring-4 focus:ring-black/10"
              />
            </div>

            {/* Email */}
            <div className="mb-[18px]">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                // Translated
                placeholder="Enter your email"
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm transition-all duration-300 outline-none focus:border-black focus:ring-4 focus:ring-black/10"
              />
            </div>

            {/* Password */}
            <div className="mb-[18px]">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                // Translated
                placeholder="Enter password"
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm transition-all duration-300 outline-none focus:border-black focus:ring-4 focus:ring-black/10"
              />
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <input
                type="password"
                name="confirmpass"
                value={formData.confirmpass}
                onChange={handleChange}
                // Translated
                placeholder="Confirm your password"
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm transition-all duration-300 outline-none focus:border-black focus:ring-4 focus:ring-black/10"
              />
            </div>

            {/* Register Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full py-3.5 bg-black text-white rounded-xl text-base font-semibold ${loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center my-6 gap-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            {/* Translated */}
            <span className="text-sm text-gray-400">Or sign up with</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Social Login */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={loginWithGoogle}
              className="flex-1 p-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 font-semibold text-sm hover:border-black hover:bg-gray-50 hover:-translate-y-0.5 active:translate-y-0"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>


          </div>

          {/* Login Link */}
          <div className="text-center">
            <span className="text-sm text-gray-500">
              {/* Translated */}
              Already have an account?{" "}
            </span>
            <Link
              to="/login"
              className="text-black bg-transparent border-none cursor-pointer font-semibold transition-opacity duration-300 hover:opacity-70 text-sm"
            >
              Log in now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";

// Error Alert Component with professional styling
const ErrorAlert = ({ message, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => onClose(), 300);
  }, [onClose]);

  useEffect(() => {
    // Trigger enter animation
    const showTimer = setTimeout(() => setIsVisible(true), 10);

    // Auto dismiss after 5 seconds
    const dismissTimer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [handleClose]);

  // Categorize error for better user experience
  const getErrorDetails = (errorMessage) => {
    const lowerMessage = errorMessage.toLowerCase();

    if (lowerMessage.includes("password") || lowerMessage.includes("incorrect") || lowerMessage.includes("wrong")) {
      return {
        title: "Incorrect Credentials",
        description: "The password you entered is incorrect. Please try again.",
        icon: "lock"
      };
    }
    if (lowerMessage.includes("user") || lowerMessage.includes("not found") || lowerMessage.includes("exist")) {
      return {
        title: "Account Not Found",
        description: "No account found with this username or email.",
        icon: "user"
      };
    }
    if (lowerMessage.includes("network") || lowerMessage.includes("connection") || lowerMessage.includes("timeout")) {
      return {
        title: "Connection Error",
        description: "Unable to connect to server. Please check your internet connection.",
        icon: "wifi"
      };
    }
    if (lowerMessage.includes("blocked") || lowerMessage.includes("locked") || lowerMessage.includes("suspended")) {
      return {
        title: "Account Locked",
        description: "Your account has been temporarily locked. Please try again later.",
        icon: "shield"
      };
    }
    if (lowerMessage.includes("too many") || lowerMessage.includes("rate limit")) {
      return {
        title: "Too Many Attempts",
        description: "You've made too many login attempts. Please wait a moment.",
        icon: "clock"
      };
    }

    return {
      title: "Login Failed",
      description: errorMessage,
      icon: "alert"
    };
  };

  const errorDetails = getErrorDetails(message);

  const renderIcon = () => {
    const iconClass = "w-6 h-6 text-red-500";
    switch (errorDetails.icon) {
      case "lock":
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case "user":
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case "wifi":
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        );
      case "shield":
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case "clock":
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`mb-5 overflow-hidden rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 shadow-lg transition-all duration-300 ease-out ${isVisible && !isLeaving
        ? "opacity-100 translate-y-0"
        : "opacity-0 -translate-y-2"
        }`}
    >
      <div className="relative p-4">
        {/* Progress bar for auto-dismiss */}
        <div className="absolute top-0 left-0 h-1 bg-red-400 animate-shrink-width rounded-t-xl" />

        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
            {renderIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-red-800 mb-0.5">
              {errorDetails.title}
            </h4>
            <p className="text-sm text-red-600 leading-relaxed">
              {errorDetails.description}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const LoginForm = () => {
  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: "",
    remember: false,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shakeInputs, setShakeInputs] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(formData.usernameOrEmail, formData.password);
      // Only keep submitting true when successful - will navigate away
      navigate("/home");
    } catch (submitError) {
      // Immediately stop submitting so error is visible
      setSubmitting(false);

      const message =
        submitError?.response?.data?.message ||
        submitError?.message ||
        "An error occurred during login";
      setError(message);
      // Trigger shake animation on inputs
      setShakeInputs(true);
      setTimeout(() => setShakeInputs(false), 500);
    }
  };

  const loginWithGoogle = () => {
    // Get Google OAuth config from environment variables
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      "424511485278-d36bocf4e3avqsadguauellt3gn4l412.apps.googleusercontent.com";

    // Redirect to frontend google-loading page (Google will redirect here with code)
    const redirectUri =
      import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
      "http://localhost:5173/google-loading";

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
    <div className="fixed inset-0 flex items-center justify-center bg-white p-5 overflow-auto font-sans">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-2xl p-10 shadow-2xl animate-fade-in-down">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome</h1>
            <p className="text-gray-500 text-sm">Login to your account</p>
          </div>

          {/* Error Alert */}
          {error && (
            <ErrorAlert message={error} onClose={() => setError("")} />
          )}

          {/* Form */}
          <div className="mb-6">
            {/* Username */}
            <form className="mb-6" onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username/Email
                </label>
                <input
                  type="text"
                  name="usernameOrEmail"
                  value={formData.usernameOrEmail}
                  onChange={handleChange}
                  placeholder="Enter your username or email"
                  className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all outline-none focus:border-black focus:ring-4 focus:ring-black/10 ${error ? "border-red-300 bg-red-50/50" : "border-gray-200"
                    } ${shakeInputs ? "animate-shake" : ""}`}
                />
              </div>

              {/* Password */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all outline-none focus:border-black focus:ring-4 focus:ring-black/10 ${error ? "border-red-300 bg-red-50/50" : "border-gray-200"
                    } ${shakeInputs ? "animate-shake" : ""}`}
                />
              </div>

              {/* Remember & Forgot */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    name="remember"
                    checked={formData.remember}
                    onChange={handleChange}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 text-black focus:ring-black"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-gray-500 cursor-pointer"
                  >
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm font-semibold text-black transition-opacity hover:opacity-70"
                >
                  Forgot password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 bg-black text-white rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md ${submitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
              >
                {submitting ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="flex items-center my-6 gap-4">
            <div className="flex-grow h-px bg-gray-200"></div>
            <span className="text-sm text-gray-400">Or log in with</span>
            <div className="flex-grow h-px bg-gray-200"></div>
          </div>

          {/* Social Login */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={loginWithGoogle}
              className="flex-1 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 font-semibold text-sm hover:border-black hover:bg-gray-50 hover:-translate-y-0.5"
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

          {/* Register Link */}
          <div className="text-center">
            <span className="text-sm text-gray-500">
              Don't have an account?{" "}
            </span>
            <Link
              to="/register"
              className="text-sm font-semibold text-black transition-opacity hover:opacity-70"
            >
              Sign up now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;

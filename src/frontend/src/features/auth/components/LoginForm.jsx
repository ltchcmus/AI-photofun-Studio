import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";

const LoginForm = () => {
  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: "",
    remember: false,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(formData.usernameOrEmail, formData.password);
      navigate("/home");
    } catch (submitError) {
      const message =
        submitError?.response?.data?.message ||
        submitError?.message ||
        "An error occurred during login";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const loginWithGoogle = () => {
    // Get Google OAuth config from environment variables
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      "935823816630-4thvb6jh7hboao1dt67kf9cvei7glshl.apps.googleusercontent.com";

    // Redirect to frontend google-loading page, not backend
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

  const loginWithFacebook = () => {
    alert("Facebook login functionality (Coming soon)");
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm transition-all outline-none focus:border-black focus:ring-4 focus:ring-black/10"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm transition-all outline-none focus:border-black focus:ring-4 focus:ring-black/10"
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-4 text-red-500 text-sm text-center">
                  {error}
                </div>
              )}

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

            <button
              onClick={loginWithFacebook}
              className="flex-1 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 font-semibold text-sm hover:border-black hover:bg-gray-50 hover:-translate-y-0.5"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877f2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
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

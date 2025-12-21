import React, { useState } from "react";
import { toast } from "react-hot-toast";
import axiosClient from "../../api/axiosClient";

const SetPasswordModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validatePassword = (password) => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 4) {
      return "Password must be at least 4 characters";
    }
    if (password.length > 30) {
      return "Password must not exceed 30 characters";
    }
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate password
    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Check if passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosClient.post("/api/v1/identity/users/set-password", {
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      if (response.data.code === 1000 && response.data.result) {
        toast.success("Password set successfully!");
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      } else {
        setError(response.data.message || "Failed to set password");
      }
    } catch (err) {
      console.error("Set password error:", err);
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to set password";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        {/* Close button - optional, user should set password */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          type="button"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Set Your Password
          </h2>
          <p className="text-gray-500 text-sm">
            You logged in with Google. Please set a password to secure your
            account.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* New Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Enter new password (4-30 characters)"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm transition-all duration-300 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              disabled={loading}
            />
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm transition-all duration-300 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              disabled={loading}
            />
          </div>

          {/* Password Requirements */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1 font-medium">
              Password requirements:
            </p>
            <ul className="text-xs text-gray-500 list-disc list-inside space-y-1">
              <li>Minimum 4 characters</li>
              <li>Maximum 30 characters</li>
              <li>Both passwords must match</li>
            </ul>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 bg-blue-600 text-white rounded-xl text-base font-semibold transition-all duration-300 ${
              loading
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-700 hover:shadow-lg"
            }`}
          >
            {loading ? "Setting Password..." : "Set Password"}
          </button>

          {/* Skip button (optional) */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full mt-3 py-3 bg-gray-100 text-gray-700 rounded-xl text-base font-semibold hover:bg-gray-200 transition-all duration-300"
          >
            Skip for Now
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetPasswordModal;

import React from "react";
import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";

const FailurePage = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center animate-fade-in">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>

          {/* Error Message */}
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Login Failed
          </h1>
          <p className="text-gray-600 mb-2">
            We couldn't complete your Google login.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            This could be due to:
          </p>

          {/* Reasons List */}
          <div className="bg-red-50 rounded-lg p-4 mb-6 text-left">
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Cancelled authorization with Google</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Network connection issues</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Account registration limit reached from your IP</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Server error occurred</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 hover:shadow-lg"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/register")}
              className="w-full py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-black transition-all duration-300"
            >
              Create Account Manually
            </button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-400 mt-6">
            Need help?{" "}
            <a
              href="mailto:support@photofun.studio"
              className="text-black underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FailurePage;

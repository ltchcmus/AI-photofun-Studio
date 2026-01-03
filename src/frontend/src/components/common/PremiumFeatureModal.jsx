import React, { useEffect } from "react";
import { Crown, X, Sparkles, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PremiumFeatureModal = ({ isOpen, onClose, featureName, isDarkMode }) => {
  const navigate = useNavigate();

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleUpgrade = () => {
    navigate("/pricing");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 ${
          isDarkMode ? "bg-slate-900/80" : "bg-gray-900/60"
        } backdrop-blur-sm`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative ${
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-gray-200"
        } border-2 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in`}
      >
        {/* Gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 ${
            isDarkMode
              ? "text-slate-400 hover:text-white hover:bg-slate-700"
              : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
          } rounded-lg p-1.5 transition-all duration-200 hover:scale-110`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8 pt-10">
          {/* Icon */}
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div
              className={`absolute inset-0 ${
                isDarkMode ? "bg-amber-500/20" : "bg-amber-400/20"
              } rounded-2xl animate-pulse-subtle`}
            />
            <div
              className={`relative w-full h-full ${
                isDarkMode
                  ? "bg-gradient-to-br from-amber-500 to-amber-600"
                  : "bg-gradient-to-br from-amber-400 to-amber-500"
              } rounded-2xl flex items-center justify-center shadow-lg`}
            >
              <Crown className="w-8 h-8 text-white" />
            </div>
            {/* Decorative sparkles */}
            <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
            <Lock
              className="w-3 h-3 text-amber-500 absolute -bottom-1 -left-1 animate-pulse"
              style={{ animationDelay: "500ms" }}
            />
          </div>

          {/* Text */}
          <div className="text-center space-y-3 mb-8">
            <h3
              className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Premium Feature
            </h3>
            <p
              className={`text-sm leading-relaxed ${
                isDarkMode ? "text-slate-400" : "text-gray-600"
              }`}
            >
              <span className="font-semibold text-amber-500">
                {featureName}
              </span>{" "}
              is a premium feature that unlocks advanced AI capabilities for
              your creative projects.
            </p>
          </div>

          {/* Benefits */}
          <div
            className={`${
              isDarkMode ? "bg-slate-900/50" : "bg-gray-50"
            } rounded-xl p-4 mb-6 space-y-2`}
          >
            <p
              className={`text-xs font-medium ${
                isDarkMode ? "text-slate-400" : "text-gray-500"
              } uppercase tracking-wider mb-3`}
            >
              Premium Includes
            </p>
            {[
              "Unlimited AI generations",
              "Advanced video features",
              "Priority processing",
              "High-resolution outputs",
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span
                  className={`text-sm ${
                    isDarkMode ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  {benefit}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleUpgrade}
              className={`w-full ${
                isDarkMode
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                  : "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600"
              } text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/30 active:scale-[0.98] flex items-center justify-center gap-2 group`}
            >
              <Crown className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              Upgrade to Premium
            </button>
            <button
              onClick={onClose}
              className={`w-full ${
                isDarkMode
                  ? "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              } font-medium py-3 px-6 rounded-xl transition-all duration-200`}
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumFeatureModal;

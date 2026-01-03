import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Zap, Crown, ArrowRight, TrendingUp } from "lucide-react";

/**
 * Token Limit Modal - Shows when user runs out of tokens
 * Encourages upgrade to Premium
 */
const TokenLimitModal = ({ isOpen, onClose, tokensRemaining = 0 }) => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    const checkDarkMode = () => {
      const darkModeStorage = localStorage.getItem("darkMode") === "true";
      const bodyHasDark = document.body.classList.contains("dark");
      setIsDarkMode(darkModeStorage || bodyHasDark);
    };

    checkDarkMode();
    window.addEventListener("storage", checkDarkMode);
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      window.removeEventListener("storage", checkDarkMode);
      observer.disconnect();
    };
  }, []);

  const handleUpgrade = () => {
    navigate("/pricing");
    onClose();
  };

  if (!isOpen) return null;

  const isLowTokens = tokensRemaining > 0 && tokensRemaining <= 50;
  const isOutOfTokens = tokensRemaining <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md ${
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-slate-200"
        } rounded-2xl border-2 shadow-2xl overflow-hidden animate-scale-in`}
      >
        {/* Decorative header gradient */}
        <div
          className={`absolute top-0 left-0 right-0 h-32 ${
            isDarkMode
              ? "bg-gradient-to-br from-amber-500/20 via-purple-500/10 to-transparent"
              : "bg-gradient-to-br from-amber-200/40 via-purple-200/20 to-transparent"
          } blur-2xl`}
        />

        {/* Content */}
        <div className="relative p-6 space-y-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 ${
              isDarkMode
                ? "hover:bg-slate-700 text-slate-400"
                : "hover:bg-slate-100 text-slate-500"
            } p-2 rounded-lg transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center">
            <div
              className={`relative w-20 h-20 ${
                isOutOfTokens
                  ? isDarkMode
                    ? "bg-red-500/20"
                    : "bg-red-100"
                  : isDarkMode
                  ? "bg-amber-500/20"
                  : "bg-amber-100"
              } rounded-2xl flex items-center justify-center`}
            >
              {isOutOfTokens ? (
                <Zap
                  className={`w-10 h-10 ${
                    isDarkMode ? "text-red-400" : "text-red-600"
                  }`}
                />
              ) : (
                <TrendingUp
                  className={`w-10 h-10 ${
                    isDarkMode ? "text-amber-400" : "text-amber-600"
                  } animate-pulse-subtle`}
                />
              )}
              {/* Glow effect */}
              <div
                className={`absolute inset-0 rounded-2xl ${
                  isOutOfTokens ? "bg-red-500/20" : "bg-amber-500/20"
                } blur-xl opacity-50`}
              />
            </div>
          </div>

          {/* Title & Message */}
          <div className="text-center space-y-2">
            <h2
              className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              {isOutOfTokens
                ? "Out of Tokens"
                : `Only ${tokensRemaining} Tokens Left`}
            </h2>
            <p
              className={`text-sm ${
                isDarkMode ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {isOutOfTokens
                ? "You've used all your daily tokens. Upgrade to Premium for unlimited creativity!"
                : "You're running low on tokens. Upgrade now to keep creating without limits."}
            </p>
          </div>

          {/* Premium benefits */}
          <div
            className={`${
              isDarkMode ? "bg-slate-700/50" : "bg-slate-50"
            } rounded-xl p-4 space-y-3`}
          >
            <div className="flex items-center gap-2">
              <Crown
                className={`w-5 h-5 ${
                  isDarkMode ? "text-amber-400" : "text-amber-600"
                }`}
              />
              <h3
                className={`font-semibold ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Premium Benefits
              </h3>
            </div>
            <ul className="space-y-2">
              {[
                "2000 tokens every day",
                "Priority generation queue",
                "All AI tools unlocked",
                "Premium support 24/7",
              ].map((benefit, index) => (
                <li
                  key={index}
                  className={`flex items-center gap-2 text-sm ${
                    isDarkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isDarkMode ? "bg-amber-400" : "bg-amber-600"
                    }`}
                  />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              className={`group/btn relative overflow-hidden w-full py-3.5 rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 ${
                isDarkMode
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 hover:shadow-xl hover:shadow-amber-500/40"
                  : "bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:shadow-xl hover:shadow-slate-900/40"
              }`}
            >
              {/* Shimmer effect */}
              <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <span className="relative flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Upgrade to Premium
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </span>
            </button>

            <button
              onClick={onClose}
              className={`w-full py-3 rounded-xl font-medium transition-all duration-200 ${
                isDarkMode
                  ? "text-slate-400 hover:bg-slate-700 hover:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              Maybe Later
            </button>
          </div>

          {/* Price hint */}
          <p
            className={`text-center text-xs ${
              isDarkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Starting from <span className="font-semibold">$5/month</span> •
            Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
};

export default TokenLimitModal;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Sparkles, Zap, Star, ArrowRight, X, Check } from "lucide-react";

/**
 * Premium Upgrade CTA Component
 * Variants: 'banner', 'card', 'floating', 'minimal'
 * Placement: Can be used anywhere in the app
 */
const PremiumUpgradeCTA = ({
  variant = "card",
  onClose = null,
  showClose = false,
  className = "",
}) => {
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

  const handleUpgradeClick = () => {
    navigate("/pricing");
  };

  // Banner variant - slim horizontal banner
  if (variant === "banner") {
    return (
      <div
        className={`relative overflow-hidden ${
          isDarkMode
            ? "bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 border-slate-600"
            : "bg-gradient-to-r from-slate-50 via-white to-slate-50 border-slate-200"
        } border rounded-2xl p-4 ${className} animate-fade-in`}
      >
        {/* Decorative elements */}
        <div
          className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 ${
            isDarkMode ? "bg-amber-500" : "bg-amber-300"
          }`}
          style={{ transform: "translate(30%, -30%)" }}
        />

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 ${
                isDarkMode ? "bg-amber-500/20" : "bg-amber-100"
              } rounded-xl flex items-center justify-center`}
            >
              <Crown
                className={`w-5 h-5 ${
                  isDarkMode ? "text-amber-400" : "text-amber-600"
                }`}
              />
            </div>
            <div>
              <p
                className={`font-semibold ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Unlock Premium Features
              </p>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Get unlimited tokens and priority access
              </p>
            </div>
          </div>

          <button
            onClick={handleUpgradeClick}
            className={`group/btn px-6 py-2.5 rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 ${
              isDarkMode
                ? "bg-amber-500 text-slate-900 hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/30"
                : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg"
            }`}
          >
            Upgrade
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>

          {showClose && onClose && (
            <button
              onClick={onClose}
              className={`${
                isDarkMode
                  ? "hover:bg-slate-700 text-slate-400"
                  : "hover:bg-slate-100 text-slate-500"
              } p-2 rounded-lg transition-colors`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Card variant - elegant minimal banner
  if (variant === "card") {
    return (
      <div
        className={`group/card relative overflow-hidden ${
          isDarkMode
            ? "bg-slate-800/50 border-slate-700/60"
            : "bg-slate-50/80 border-slate-200/60"
        } backdrop-blur-sm border rounded-2xl ${className} animate-fade-in transition-all duration-500 hover:border-slate-600 hover:shadow-xl ${
          isDarkMode ? "hover:shadow-slate-900/40" : "hover:shadow-slate-900/10"
        }`}
      >
        {/* Subtle gradient background */}
        <div
          className={`absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 ${
            isDarkMode
              ? "bg-gradient-to-r from-amber-500/5 via-transparent to-purple-500/5"
              : "bg-gradient-to-r from-amber-100/30 via-transparent to-purple-100/30"
          }`}
        />

        <div className="relative p-6">
          <div className="flex items-center justify-between gap-6">
            {/* Left side - Icon and text */}
            <div className="flex items-center gap-4 flex-1">
              <div
                className={`relative w-12 h-12 ${
                  isDarkMode ? "bg-slate-700/50" : "bg-white"
                } rounded-xl flex items-center justify-center shadow-sm group-hover/card:scale-110 transition-all duration-500`}
              >
                <Crown
                  className={`w-6 h-6 ${
                    isDarkMode ? "text-amber-400" : "text-amber-600"
                  } group-hover/card:rotate-12 transition-transform duration-500`}
                />
                {/* Glow effect */}
                <div
                  className={`absolute inset-0 rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 ${
                    isDarkMode ? "bg-amber-500/10" : "bg-amber-400/10"
                  } blur-md`}
                />
              </div>

              <div className="space-y-1">
                <h3
                  className={`font-semibold ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  Unlock Premium Features
                </h3>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  2000 tokens daily • Priority queue • All tools unlocked
                </p>
              </div>
            </div>

            {/* Right side - CTA */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span
                  className={`text-xs uppercase tracking-wider ${
                    isDarkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Starting at
                </span>
                <span
                  className={`text-lg font-bold ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  $5/mo
                </span>
              </div>

              <button
                onClick={handleUpgradeClick}
                className={`group/btn relative overflow-hidden px-6 py-2.5 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 ${
                  isDarkMode
                    ? "bg-slate-100 text-slate-900 hover:bg-white hover:shadow-lg"
                    : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/30"
                }`}
              >
                {/* Shimmer effect */}
                <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <span className="relative flex items-center gap-2">
                  Upgrade
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </span>
              </button>

              {showClose && onClose && (
                <button
                  onClick={onClose}
                  className={`${
                    isDarkMode
                      ? "hover:bg-slate-700 text-slate-400 hover:text-white"
                      : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                  } p-2 rounded-lg transition-all duration-200`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Floating variant - fixed position floating card
  if (variant === "floating") {
    return (
      <div
        className={`fixed bottom-20 right-6 z-40 w-80 ${
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-slate-200"
        } border-2 rounded-2xl p-5 shadow-2xl ${className} animate-fade-in`}
      >
        <div className="relative">
          {/* Close button */}
          {showClose && onClose && (
            <button
              onClick={onClose}
              className={`absolute -top-2 -right-2 ${
                isDarkMode
                  ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  : "bg-white hover:bg-slate-100 text-slate-600"
              } p-1.5 rounded-full shadow-lg transition-colors border ${
                isDarkMode ? "border-slate-600" : "border-slate-200"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Content */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 ${
                  isDarkMode ? "bg-amber-500/20" : "bg-amber-100"
                } rounded-xl flex items-center justify-center`}
              >
                <Star
                  className={`w-5 h-5 ${
                    isDarkMode ? "text-amber-400" : "text-amber-600"
                  } animate-pulse-subtle`}
                />
              </div>
              <div>
                <h4
                  className={`font-bold ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  Ready for More?
                </h4>
                <p
                  className={`text-xs ${
                    isDarkMode ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  Upgrade to Premium today
                </p>
              </div>
            </div>

            <p
              className={`text-sm ${
                isDarkMode ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Get <span className="font-semibold">2000 tokens daily</span>,
              priority queue, and exclusive features.
            </p>

            <button
              onClick={handleUpgradeClick}
              className={`w-full py-2.5 rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 ${
                isDarkMode
                  ? "bg-amber-500 text-slate-900 hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/30"
                  : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg"
              }`}
            >
              View Plans
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Minimal variant - compact inline CTA
  if (variant === "minimal") {
    return (
      <button
        onClick={handleUpgradeClick}
        className={`group/minimal inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
          isDarkMode
            ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30"
            : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
        } ${className}`}
      >
        <Crown className="w-4 h-4 group-hover/minimal:rotate-12 transition-transform" />
        <span>Upgrade to Premium</span>
        <ArrowRight className="w-4 h-4 group-hover/minimal:translate-x-1 transition-transform" />
      </button>
    );
  }

  return null;
};

export default PremiumUpgradeCTA;

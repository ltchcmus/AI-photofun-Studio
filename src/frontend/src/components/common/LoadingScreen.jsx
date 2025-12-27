import React, { useState, useEffect } from "react";

const LoadingScreen = ({ message }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check dark mode from localStorage or body class
    const darkModeStorage = localStorage.getItem("darkMode") === "true";
    const bodyHasDark = document.body.classList.contains("dark");
    setIsDarkMode(darkModeStorage || bodyHasDark);
  }, []);

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center transition-colors duration-300 ${isDarkMode ? "bg-gray-900" : "bg-white"
        }`}
    >
      <div className="text-center">
        {/* Animated logo or dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div
            className={`w-3 h-3 rounded-full animate-bounce ${isDarkMode ? "bg-yellow-400" : "bg-yellow-500"
              }`}
            style={{ animationDelay: "0ms" }}
          />
          <div
            className={`w-3 h-3 rounded-full animate-bounce ${isDarkMode ? "bg-orange-400" : "bg-orange-500"
              }`}
            style={{ animationDelay: "150ms" }}
          />
          <div
            className={`w-3 h-3 rounded-full animate-bounce ${isDarkMode ? "bg-pink-400" : "bg-pink-500"
              }`}
            style={{ animationDelay: "300ms" }}
          />
        </div>

        {/* App name */}
        <h1 className={`text-xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-800"
          }`}>
          AI photofun Studio
        </h1>

        {/* Loading message */}
        {message && (
          <p className={`text-sm animate-pulse ${isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}>
            {message}
          </p>
        )}
        {!message && (
          <p className={`text-sm animate-pulse ${isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}>
            Loading...
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;


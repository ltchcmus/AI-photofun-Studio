import React from "react";

const LoadingScreen = ({ message }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5 mb-4">
          <div
            className="w-2 h-2 rounded-full bg-yellow-500 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-orange-500 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-pink-500 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
        {message && (
          <p className="text-gray-600 text-sm animate-pulse">{message}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;

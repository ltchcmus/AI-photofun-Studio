import React from "react";
import { Crown } from "lucide-react";

const LoadingScreen = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white">
      {/* Animated Logo Circle with Premium Gradient */}
      <div className="relative flex items-center justify-center mb-8">
        {/* Outer rotating gradient ring */}
        <div
          className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 animate-spin"
          style={{ animationDuration: "3s" }}
        />

        {/* Inner white circle */}
        <div className="absolute w-28 h-28 rounded-full bg-white" />

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Crown className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>
      </div>

      {/* Loading Text */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 bg-clip-text text-transparent">
          AI Photofun Studio
        </h1>
        <p className="text-xl font-semibold text-gray-900">
          Đang khởi tạo trải nghiệm
        </p>
        <p className="text-gray-600 text-sm">Vui lòng chờ trong giây lát...</p>

        {/* Loading dots animation */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
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
      </div>
    </div>
  );
};

export default LoadingScreen;

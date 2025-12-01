import React from "react";

const LoadingScreen = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="relative flex items-center justify-center">
        <div className="w-24 h-24 rounded-full border-2 border-white/10" />
        <div className="absolute w-20 h-20 border-4 border-transparent border-t-white rounded-full animate-spin" />
      </div>
      <div className="mt-8 text-center space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">
          AI Photofun Studio
        </p>
        <p className="text-3xl font-semibold">Đang khởi tạo trải nghiệm</p>
        <p className="text-white/60 text-sm">Vui lòng chờ trong giây lát...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;

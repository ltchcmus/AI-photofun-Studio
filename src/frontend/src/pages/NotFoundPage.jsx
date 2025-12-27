import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-6 text-gray-700">
      <div>
        <p className="text-6xl font-bold">404</p>
        <p className="mt-2 text-xl">Không tìm thấy trang bạn cần.</p>
      </div>
      <Link
        to="/home"
        className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
      >
        Quay về trang chủ
      </Link>
    </div>
  );
}

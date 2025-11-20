import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import AITools from "../pages/AITools";
import HomePage from "../pages/HomePage";
import NotFoundPage from "../pages/NotFoundPage";
import AppLayout from "../layouts/AppLayout";
import BackgroundTools from "../pages/BackgroundTools";
import TextToImage from "../pages/TextToImage";
import FaceSwap from "../pages/FaceSwap";
import ImageEnhance from "../pages/ImageEnhance";
import PhotoRestore from "../pages/PhotoRestore";
import StyleTransfer from "../pages/StyleTransfer";
import Notifications from "../pages/Notifications";
import Profile from "../pages/Profile";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* routes using shared layout (sidebar + mobile nav) */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/ai-tools" element={<AITools />} />
        <Route path="/background-tools" element={<BackgroundTools />} />
        <Route path="/text-to-image" element={<TextToImage />} />
        <Route path="/face-swap" element={<FaceSwap />} />
        <Route path="/image-enhance" element={<ImageEnhance />} />
        <Route path="/photo-restore" element={<PhotoRestore />} />
        <Route path="/style-transfer" element={<StyleTransfer />} />
        <Route path="/activity" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;

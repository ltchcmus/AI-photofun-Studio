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
import Relight from "../pages/Relight";
import ImageExpand from "../pages/ImageExpand";
import Notifications from "../pages/Notifications";
import MessagesPage from "../pages/MessagesPage";
import Profile from "../pages/Profile";
import UserProfile from "../pages/UserProfile";
import EditProfile from "../pages/EditProfile";
import PremiumLayout from "../layouts/PremiumLayout";
import PremiumDashboard from "../pages/PremiumDashboard";
import PaymentSuccess from "../pages/PaymentSuccess";
import PricingPage from "../pages/PricingPage";
import PaymentFail from "../pages/PaymentFail";
import Settings from "../pages/Settings";
import { useAuthContext } from "../context/AuthContext";
import LoadingScreen from "../components/common/LoadingScreen";
import { useAuth } from "../hooks/useAuth";
import VerifyEmailPage from "../pages/VerifyEmailPage";
import GoogleLoadingPage from "../pages/GoogleLoadingPage";
import FailurePage from "../pages/FailurePage";

const RequireAuth = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppRoutes() {
  const { loading } = useAuthContext();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/google-loading" element={<GoogleLoadingPage />} />
      <Route path="/failure" element={<FailurePage />} />

      {/* routes using shared layout (sidebar + mobile nav) */}
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/ai-tools" element={<AITools />} />
        <Route path="/background-tools" element={<BackgroundTools />} />
        <Route path="/text-to-image" element={<TextToImage />} />
        <Route path="/face-swap" element={<FaceSwap />} />
        <Route path="/image-enhance" element={<ImageEnhance />} />
        <Route path="/photo-restore" element={<PhotoRestore />} />
        <Route path="/style-transfer" element={<StyleTransfer />} />
        <Route path="/relight" element={<Relight />} />
        <Route path="/image-expand" element={<ImageExpand />} />
        <Route path="/activity" element={<Notifications />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/user/:userId" element={<UserProfile />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-fail" element={<PaymentFail />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route
        element={
          <RequireAuth>
            <PremiumLayout />
          </RequireAuth>
        }
      >
        <Route path="/premium" element={<PremiumDashboard />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;

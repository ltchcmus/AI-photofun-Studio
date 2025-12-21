import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from "../components/common/LoadingScreen";
import axiosClient from "../api/axiosClient";
import SetPasswordModal from "../components/auth/SetPasswordModal";

const GoogleLoadingPage = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState("");
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  
  // Prevent double call in React StrictMode
  const hasCalledRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls (React StrictMode calls useEffect twice)
    if (hasCalledRef.current) {
      console.log("Skipping duplicate call");
      return;
    }
    hasCalledRef.current = true;

    const handleGoogleCallback = async () => {
      try {
        // Get authorization code from URL (from Google redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (!code) {
          console.error("No authorization code received from Google");
          navigate("/failure");
          return;
        }

        console.log("Processing Google authentication with code...");

        // Call backend authentication endpoint via API Gateway (same as normal login)
        // API Gateway is at port 8888 with prefix /api/v1
        const authResponse = await fetch(
          `http://localhost:8888/api/v1/identity/auth/authentication?code=${code}`,
          {
            method: "GET",
            credentials: "include", // Important: include cookies
          }
        );

        if (!authResponse.ok) {
          throw new Error("Authentication request failed");
        }

        const authData = await authResponse.json();
        console.log("Auth response:", authData);

        if (!authData.success) {
          console.error("Backend reported authentication failure");
          navigate("/failure");
          return;
        }

        // Get access token from header (backend sets this)
        const accessToken = authResponse.headers.get("X-Access-Token");
        console.log("Access token received:", accessToken ? "Yes" : "No");

        if (accessToken) {
          // Store access token in localStorage
          localStorage.setItem("token", accessToken);
          console.log("Access token stored in localStorage");
          console.log("Token value:", accessToken);
          console.log("Token length:", accessToken.length);
          
          // Try to hydrate user (optional - just for loading user data)
          try {
            await refreshUser();
          } catch (userErr) {
            console.warn("Could not fetch user info, but token is valid:", userErr);
          }
          
          // Check if user needs to set password (logged in via Google and hasn't set password yet)
          try {
            console.log("Calling check-login-by-google API...");
            const checkResponse = await axiosClient.get("/api/v1/identity/users/check-login-by-google");
            console.log("✅ Check login by Google response:", checkResponse.data);
            console.log("   - Code:", checkResponse.data.code);
            console.log("   - Result (isLoginByGoogle):", checkResponse.data.result);
            console.log("   - Message:", checkResponse.data.message);
            
            if (checkResponse.data.code === 1000 && checkResponse.data.result === true) {
              // User logged in via Google and hasn't set password yet
              console.log("🔐 User needs to set password - showing modal");
              setShowSetPasswordModal(true);
              return; // Don't navigate yet, wait for password to be set
            } else {
              console.log("✅ User already set password or not Google login, proceeding to home");
            }
          } catch (checkErr) {
            console.error("❌ Could not check Google login status:", checkErr);
            console.error("   - Error details:", checkErr.response?.data || checkErr.message);
            // Continue to home even if check fails
          }
          
          // Navigate to home if no password needed or check failed
          console.log("Google login successful! Redirecting to /home");
          navigate("/home");
        } else {
          console.error("No access token in response header");
          navigate("/failure");
        }
      } catch (err) {
        console.error("Google login error:", err);
        setError(err?.response?.data?.message || err?.message || "Google login failed");
        setTimeout(() => {
          navigate("/failure");
        }, 2000);
      }
    };

    handleGoogleCallback();
  }, [navigate, refreshUser]);

  const handlePasswordSet = () => {
    // After password is set successfully, navigate to home
    console.log("Password set successfully, navigating to home");
    navigate("/home");
  };

  const handleSkipPassword = () => {
    // If user skips setting password, still navigate to home
    console.log("User skipped password setup, navigating to home");
    navigate("/home");
  };

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-red-500 text-xl font-semibold mb-4">
            {error}
          </div>
          <p className="text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <LoadingScreen message="Completing Google login..." />
      {showSetPasswordModal && (
        <SetPasswordModal
          onClose={handleSkipPassword}
          onSuccess={handlePasswordSet}
        />
      )}
    </>
  );
};

export default GoogleLoadingPage;

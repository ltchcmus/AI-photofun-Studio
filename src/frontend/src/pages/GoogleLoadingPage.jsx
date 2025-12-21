import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from "../components/common/LoadingScreen";
import axiosClient from "../api/axiosClient";

const GoogleLoadingPage = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState("");
  
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
          
          // Navigate to home regardless
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

  return <LoadingScreen message="Completing Google login..." />;
};

export default GoogleLoadingPage;

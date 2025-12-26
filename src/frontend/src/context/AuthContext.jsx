import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authApi } from "../api/authApi";
import { userApi } from "../api/userApi";

const DEFAULT_AVATAR = "https://placehold.co/40x40/111/fff?text=U";

export const AuthContext = createContext(null);

const normalizeUser = (rawUser) => {
  if (!rawUser) return null;

  return {
    id: rawUser?.id || rawUser?.userId || rawUser?.userID || rawUser?.user_id,
    fullName: rawUser?.fullName || rawUser?.username || rawUser?.email || "",
    email: rawUser?.email || "",
    avatar:
      rawUser?.avatarUrl ||
      rawUser?.avatar ||
      rawUser?.profileImage ||
      DEFAULT_AVATAR,
    // Premium fields
    isPremium: Boolean(
      rawUser?.isPremium ||
      rawUser?.premium ||
      rawUser?.premiumOneMonth ||
      rawUser?.premiumSixMonths
    ),
    premiumOneMonth: Boolean(rawUser?.premiumOneMonth),
    premiumSixMonths: Boolean(rawUser?.premiumSixMonths),
    // Tokens
    tokens: rawUser?.tokens ?? 0,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");

  const hydrateUser = useCallback(async () => {
    try {
      const response = await userApi.getMe();
      const rawUser =
        response.data?.result?.data ||
        response.data?.result ||
        response.data?.data ||
        response.data?.user ||
        response.data;

      const normalized = normalizeUser(rawUser);
      setUser(normalized);
      setIsAuthenticated(Boolean(normalized));
      setError("");

      // Store user data in localStorage for AI API to use
      if (normalized?.id) {
        localStorage.setItem("user", JSON.stringify(normalized));
      }

      return normalized;
    } catch (hydrateError) {
      console.error("Failed to hydrate user", hydrateError);
      setUser(null);
      setIsAuthenticated(false);
      setError(hydrateError?.message || "Không thể tải thông tin người dùng");
      throw hydrateError;
    }
  }, []);

  // On mount, try to restore session using refresh token (HttpOnly cookie)
  // Use minimum loading time to prevent flash of login page
  useEffect(() => {
    const MIN_LOADING_TIME = 800; // Minimum time to show loading screen (ms)
    const startTime = Date.now();

    const initializeAuth = async () => {
      try {
        // Try to refresh token using HttpOnly cookie
        // This will get a new access token if refresh token cookie is valid
        await authApi.refreshToken();
        // If refresh successful, hydrate user data
        await hydrateUser();
      } catch (refreshError) {
        // Refresh failed - user needs to login again
        console.log("Session expired or not logged in");
        localStorage.removeItem("user");
      }

      // Ensure loading screen shows for at least MIN_LOADING_TIME
      // This prevents jarring flash of login page
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);

      // Use a promise to wait for remaining time before setting loading to false
      await new Promise(resolve => setTimeout(resolve, remainingTime));
      setLoading(false);
    };

    initializeAuth();
  }, [hydrateUser]);

  const login = useCallback(
    async (username, password) => {
      // Don't use global loading state here as it causes full-screen LoadingScreen
      // which hides the login form and error messages
      setError("");
      try {
        await authApi.login(username, password);
        // Only set loading true after successful API call, before hydrating user
        setLoading(true);
        const currentUser = await hydrateUser();
        setLoading(false);
        return currentUser;
      } catch (loginError) {
        console.error("Failed to login", loginError);
        setError(
          loginError?.response?.data?.message ||
          loginError?.message ||
          "Đăng nhập thất bại"
        );
        throw loginError;
      }
    },
    [hydrateUser]
  );

  const register = useCallback(async (payload) => {
    // Don't use global loading state here 
    setError("");
    try {
      const response = await authApi.register(payload);
      return response;
    } catch (registerError) {
      console.error("Failed to register", registerError);
      setError(
        registerError?.response?.data?.message ||
        registerError?.message ||
        "Đăng ký thất bại"
      );
      throw registerError;
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authApi.logout();
    } catch (logoutError) {
      console.error("Failed to logout", logoutError);
    } finally {
      // Token is cleared by authApi.logout() from memory
      localStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);
      setError("");
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      loading,
      error,
      login,
      register,
      logout,
      refreshUser: hydrateUser,
      setUser,
    }),
    [
      error,
      hydrateUser,
      isAuthenticated,
      loading,
      login,
      logout,
      register,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => useContext(AuthContext);

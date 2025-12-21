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
      return normalized;
    } catch (hydrateError) {
      console.error("Failed to hydrate user", hydrateError);
      setUser(null);
      setIsAuthenticated(false);
      setError(hydrateError?.message || "Không thể tải thông tin người dùng");
      throw hydrateError;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    hydrateUser()
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => setLoading(false));
  }, [hydrateUser]);

  const login = useCallback(
    async (username, password) => {
      setLoading(true);
      setError("");
      try {
        await authApi.login(username, password);
        const currentUser = await hydrateUser();
        return currentUser;
      } catch (loginError) {
        console.error("Failed to login", loginError);
        setError(
          loginError?.response?.data?.message ||
          loginError?.message ||
          "Đăng nhập thất bại"
        );
        throw loginError;
      } finally {
        setLoading(false);
      }
    },
    [hydrateUser]
  );

  const register = useCallback(async (payload) => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authApi.logout();
    } catch (logoutError) {
      console.error("Failed to logout", logoutError);
    } finally {
      localStorage.removeItem("token");
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

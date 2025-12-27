import { useCallback, useMemo, useState } from "react";
import { userApi } from "../api/userApi";
import { useAuth } from "./useAuth";

export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user: currentUser, refreshUser } = useAuth();

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await userApi.getMyProfile();
      const data =
        response.data?.result || response.data?.data || response.data;
      setProfile(data);
      return data;
    } catch (fetchError) {
      setError(fetchError?.message || "Không thể tải thông tin hồ sơ");
      throw fetchError;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const response = await userApi.updateProfile(payload);
    const data = response.data?.result || response.data?.data || response.data;
    setProfile(data);
    return data;
  }, []);

  const uploadAvatar = useCallback(
    async (file) => {
      if (!file) return null;
      const response = await userApi.uploadAvatar(file);
      const data =
        response.data?.result ||
        response.data?.data ||
        response.data?.avatarUrl ||
        response.data;

      try {
        await refreshUser();
      } catch (avatarError) {
        console.error(
          "Failed to refresh user after avatar upload",
          avatarError
        );
      }

      return data;
    },
    [refreshUser]
  );

  return useMemo(
    () => ({
      profile,
      currentUser,
      loading,
      error,
      fetchProfile,
      updateProfile,
      uploadAvatar,
    }),
    [
      currentUser,
      error,
      fetchProfile,
      loading,
      profile,
      updateProfile,
      uploadAvatar,
    ]
  );
};

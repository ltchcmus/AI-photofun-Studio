import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ChevronLeft, Mail, Phone, Save, User, X } from "lucide-react";
import { toast } from "../hooks/use-toast";

const API_GATEWAY = import.meta.env.VITE_API_GATEWAY || "http://localhost:8888";
const PROFILE_ENDPOINT = "/api/v1/profiles/my-profile";
const UPDATE_PROFILE_ENDPOINT = "/api/v1/profiles/update";
const CURRENT_USER_ENDPOINT = "/api/v1/identity/users/me";
const UPLOAD_AVATAR_ENDPOINT = "/api/v1/identity/users/upload-avatar";
const DEFAULT_AVATAR = "https://placehold.co/128x128/111/fff?text=U";

const DEFAULT_FORM = {
  fullName: "",
  email: "",
  phone: "",
  avatarUrl: DEFAULT_AVATAR,
  avatarFile: null,
};

const EditProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [formData, setFormData] = useState(() => ({ ...DEFAULT_FORM }));
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [status, setStatus] = useState({ error: "", success: "" });
  const isInputDisabled = loading || fetchingProfile;

  useEffect(() => {
    return () => {
      if (previewAvatar) {
        URL.revokeObjectURL(previewAvatar);
      }
    };
  }, [previewAvatar]);

  useEffect(() => {
    const fetchProfile = async () => {
      setFetchingProfile(true);
      setStatus({ error: "", success: "" });

      try {
        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_GATEWAY}${PROFILE_ENDPOINT}`, {
          method: "GET",
          headers,
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load profile information");
        }

        const profile = data.result || data.data || data;

        setFormData((prev) => ({
          ...prev,
          fullName: profile?.fullName ?? DEFAULT_FORM.fullName,
          email: profile?.email ?? DEFAULT_FORM.email,
          phone: profile?.phone ?? DEFAULT_FORM.phone,
          avatarUrl: profile?.avatarUrl ?? DEFAULT_FORM.avatarUrl,
          avatarFile: null,
        }));
      } catch (error) {
        const msg = error.message || "Unable to load profile information";
        setStatus({ error: msg, success: "" });
        toast.error(msg);
      } finally {
        setFetchingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const response = await fetch(`${API_GATEWAY}${CURRENT_USER_ENDPOINT}`, {
          method: "GET",
          headers,
          credentials: "include",
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Unable to load account information");
        }

        const rawUser =
          data.result?.data || data.result || data.data || data.user || data;

        if (!isMounted) return;

        const avatarUrl =
          rawUser?.avatarUrl ||
          rawUser?.avatar ||
          rawUser?.profileImage ||
          DEFAULT_AVATAR;

        setFormData((prev) => ({ ...prev, avatarUrl }));
      } catch (error) {
        console.error("Failed to fetch identity profile", error);
      }
    };

    fetchCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];

    if (file) {
      if (previewAvatar) {
        URL.revokeObjectURL(previewAvatar);
      }
      const nextPreview = URL.createObjectURL(file);
      setPreviewAvatar(nextPreview);
      setFormData((prev) => ({ ...prev, avatarFile: file }));
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ error: "", success: "" });
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const authHeaders = token
        ? {
          Authorization: `Bearer ${token}`,
        }
        : {};

      let nextAvatarUrl = formData.avatarUrl || DEFAULT_AVATAR;
      const hasNewAvatar = Boolean(formData.avatarFile);

      if (hasNewAvatar) {
        const avatarData = new FormData();
        avatarData.append("file", formData.avatarFile);

        const uploadResponse = await fetch(
          `${API_GATEWAY}${UPLOAD_AVATAR_ENDPOINT}`,
          {
            method: "POST",
            headers: authHeaders,
            body: avatarData,
            credentials: "include",
          }
        );

        const uploadJson = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(
            uploadJson.message || "Unable to update profile photo"
          );
        }

        nextAvatarUrl =
          uploadJson.result?.avatarUrl ||
          uploadJson.result?.data?.avatarUrl ||
          uploadJson.data?.avatarUrl ||
          uploadJson.avatarUrl ||
          nextAvatarUrl;
      }

      const headers = {
        "Content-Type": "application/json",
        ...authHeaders,
      };

      const payload = {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        avatarUrl: nextAvatarUrl,
        verified: false,
      };

      const response = await fetch(`${API_GATEWAY}${UPDATE_PROFILE_ENDPOINT}`, {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update profile");
      }

      setFormData((prev) => ({
        ...prev,
        avatarUrl: nextAvatarUrl,
        avatarFile: null,
      }));
      if (hasNewAvatar && previewAvatar) {
        URL.revokeObjectURL(previewAvatar);
        setPreviewAvatar(null);
      }

      const successMsg = data.message || "Profile updated successfully";
      setStatus({ error: "", success: successMsg });
      toast.success(successMsg);

      setTimeout(() => navigate("/profile"), 1200);
    } catch (error) {
      const errorMsg = error.message || "Unable to update profile";
      setStatus({ success: "", error: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center py-4 md:py-8">
      <div className="w-full max-w-3xl">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-white px-6 md:px-8 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="md:hidden p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
            </div>

            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            {fetchingProfile && (
              <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                Loading profile information...
              </div>
            )}
            <div className="flex flex-col items-center mb-10">
              <div className="relative group cursor-pointer">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 ring-gray-100 group-hover:ring-blue-100 transition-all">
                  <img
                    src={previewAvatar || formData.avatarUrl || DEFAULT_AVATAR}
                    alt="Avatar"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white w-8 h-8 drop-shadow-md" />
                  </div>
                </div>

                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-1 right-1 bg-blue-600 p-2.5 rounded-full text-white shadow-lg cursor-pointer hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all ring-4 ring-white"
                  title="Change profile photo"
                >
                  <Camera className="w-4 h-4" />
                </label>

                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={isInputDisabled}
                />
              </div>
              <p className="mt-4 text-sm text-gray-500 font-medium">
                Click on the photo to change
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Allowed: JPG, GIF or PNG. Max 5MB.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50/50 focus:bg-white"
                    placeholder="Enter your full name"
                    disabled={isInputDisabled}
                    required
                  />
                </div>
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50/50 focus:bg-white"
                    placeholder="your.email@example.com"
                    disabled={isInputDisabled}
                  />
                </div>
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50/50 focus:bg-white"
                    placeholder="+84 123 456 789"
                    disabled={isInputDisabled}
                  />
                </div>
              </div>
            </div>

            <div className="mt-10 flex items-center justify-end gap-4 border-t border-gray-100 pt-6">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || fetchingProfile}
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;

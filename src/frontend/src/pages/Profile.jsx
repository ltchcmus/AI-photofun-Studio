import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Globe,
  Mail,
  MapPin,
  Phone,
  Share2,
  Crown,
  Sparkles,
} from "lucide-react";
import PostList from "../components/post/PostList";
import { usePosts } from "../hooks/usePosts";
import { useProfile } from "../hooks/useProfile";

const DEFAULT_AVATAR = "https://placehold.co/128x128/111/fff?text=U";

const PROFILE_DEFAULTS = {
  fullName: "",
  bio: "Digital artist · AI creative explorer",
  email: "",
  phone: "",
  avatarUrl: DEFAULT_AVATAR,
  address: "123 Nguyễn Huệ Street, District 1, Ho Chi Minh City",
  country: "Vietnam",
  dob: "May 01, 2005",
  created: "November 12, 2025",
};

const profileStats = [{ label: "Images Created", value: "128" }];

const recentWorks = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&h=600&fit=crop",
];

const Profile = () => {
  const navigate = useNavigate();
  const {
    profile,
    currentUser,
    loading: profileLoading,
    error: profileError,
    fetchProfile,
  } = useProfile();

  const {
    posts,
    loading: postsLoading,
    error: postsError,
    handleLike,
    userCache,
  } = usePosts({ isMyPosts: true, size: 5 });

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const displayProfile = {
    fullName:
      profile?.fullName || currentUser?.fullName || PROFILE_DEFAULTS.fullName,
    bio: profile?.bio ?? PROFILE_DEFAULTS.bio,
    email: profile?.email ?? PROFILE_DEFAULTS.email,
    phone: profile?.phone ?? PROFILE_DEFAULTS.phone,
    avatarUrl:
      currentUser?.avatar ||
      profile?.avatarUrl ||
      PROFILE_DEFAULTS.avatarUrl ||
      DEFAULT_AVATAR,
    address: profile?.address ?? PROFILE_DEFAULTS.address,
    country: profile?.country ?? PROFILE_DEFAULTS.country,
    dob: profile?.dob ?? PROFILE_DEFAULTS.dob,
    created: profile?.createdAt
      ? new Date(profile.createdAt).toLocaleDateString()
      : PROFILE_DEFAULTS.created,
    isPremium: Boolean(
      profile?.isPremium ||
        profile?.premium ||
        profile?.premiumOneMonth ||
        profile?.premiumSixMonths ||
        currentUser?.premiumOneMonth ||
        currentUser?.premiumSixMonths
    ),
    premiumOneMonth: Boolean(
      profile?.premiumOneMonth || currentUser?.premiumOneMonth
    ),
    premiumSixMonths: Boolean(
      profile?.premiumSixMonths || currentUser?.premiumSixMonths
    ),
  };

  const contactDetails = [
    { id: "email", label: "Email", value: displayProfile.email, icon: Mail },
    {
      id: "phone",
      label: "Phone Number",
      value: displayProfile.phone,
      icon: Phone,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {profileLoading && (
        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-600">
          Đang tải thông tin hồ sơ...
        </div>
      )}
      {profileError && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
          {profileError}
        </div>
      )}
      <section
        className={`bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden ${
          displayProfile.isPremium
            ? "border-2 border-transparent bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50"
            : ""
        }`}
      >
        {/* Premium Background Decoration */}
        {displayProfile.isPremium && (
          <>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500" />
            <div className="absolute top-4 right-4 opacity-10">
              <Crown className="w-24 h-24 text-yellow-500" />
            </div>
          </>
        )}

        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10">
          {/* Premium Avatar with Animated Frame */}
          <div className="relative group">
            {displayProfile.isPremium && (
              <div
                className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-full animate-spin-slow opacity-75 group-hover:opacity-100 transition-opacity"
                style={{ animationDuration: "3s" }}
              />
            )}
            <div
              className={`relative ${
                displayProfile.isPremium
                  ? "p-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-full"
                  : ""
              }`}
            >
              <img
                src={displayProfile.avatarUrl}
                alt={`${displayProfile.fullName} avatar`}
                className={`w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg ${
                  displayProfile.isPremium ? "animate-pulse-glow" : ""
                }`}
              />
            </div>
            {/* Premium Crown Badge */}
            {displayProfile.isPremium && (
              <div
                className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-2 shadow-lg animate-bounce"
                style={{ animationDuration: "2s" }}
              >
                <Crown className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 w-full">
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1
                    className={`text-3xl font-bold ${
                      displayProfile.isPremium
                        ? "bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 bg-clip-text text-transparent"
                        : ""
                    }`}
                  >
                    {displayProfile.fullName}
                  </h1>
                  {displayProfile.isPremium && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white shadow-lg animate-pulse-glow">
                      <Crown className="w-3.5 h-3.5" />
                      <span>PREMIUM</span>
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {displayProfile.bio}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {profileStats.map((stat) => (
                  <div key={stat.label} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/profile/edit")}
                  className="px-6 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-900"
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  className="px-6 py-2.5 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" /> Share Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4">Contact Information</h2>
        <div className="space-y-4">
          {contactDetails.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id}>
                <p className="text-xs uppercase text-gray-500 font-semibold mb-2">
                  {item.label}
                </p>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Icon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">
                    {item.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Recent Works</h2>
          <button
            type="button"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View all
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recentWorks.map((url, index) => (
            <div
              key={url}
              className="group relative overflow-hidden rounded-xl aspect-square"
            >
              <img
                src={url}
                alt={`Recent work ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Bài viết gần đây</h2>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Quản lý bài viết
          </button>
        </div>
        {postsLoading && (
          <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Đang tải bài viết...
          </div>
        )}
        {postsError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {postsError}
          </div>
        )}
        {!postsLoading && !postsError && posts.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-600 text-center">
            Bạn chưa có bài viết nào. Tạo bài đầu tiên ở mục dashboard nhé!
          </div>
        )}
        <PostList
          posts={posts}
          userCache={userCache}
          onLikePost={handleLike}
          onNavigateAiTools={() => navigate("/ai-tools")}
        />
      </section>
    </div>
  );
};

export default Profile;

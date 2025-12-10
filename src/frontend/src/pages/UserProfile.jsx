import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Mail,
  MessageCircle,
  UserPlus,
  UserCheck,
  Crown,
  Sparkles,
} from "lucide-react";
import PostList from "../components/post/PostList";
import { userApi } from "../api/userApi";
import { postApi } from "../api/postApi";
import { communicationApi } from "../api/communicationApi";

const DEFAULT_AVATAR = "https://placehold.co/128x128/111/fff?text=U";

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;

      setLoading(true);
      setError("");

      try {
        // Fetch user info
        const userResponse = await userApi.getUserById(userId);
        const userData = userResponse?.data?.result || userResponse?.data;

        setProfile({
          id: userData?.id || userId,
          fullName: userData?.fullName || userData?.username || "Người dùng",
          username: userData?.username || "",
          email: userData?.email || "",
          bio: userData?.bio || "AI creative explorer",
          avatarUrl: userData?.avatarUrl || userData?.avatar || DEFAULT_AVATAR,
          createdAt: userData?.createdAt,
          isPremium: Boolean(
            userData?.isPremium ||
              userData?.premium ||
              userData?.premiumOneMonth ||
              userData?.premiumSixMonths
          ),
          premiumOneMonth: Boolean(userData?.premiumOneMonth),
          premiumSixMonths: Boolean(userData?.premiumSixMonths),
          followersCount: userData?.followersCount || 0,
          followingCount: userData?.followingCount || 0,
          postsCount: userData?.postsCount || 0,
        });

        // Fetch user posts
        try {
          const postsResponse = await postApi.getPostsByUserId(userId);
          const postsData =
            postsResponse?.data?.result?.data ||
            postsResponse?.data?.result ||
            postsResponse?.data ||
            [];
          setPosts(Array.isArray(postsData) ? postsData : []);
        } catch (postError) {
          console.error("Failed to fetch user posts", postError);
          setPosts([]);
        }
      } catch (fetchError) {
        console.error("Failed to fetch user profile", fetchError);
        setError("Không thể tải thông tin người dùng");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const handleFollow = () => {
    setIsFollowing((prev) => !prev);
    // TODO: Call API to follow/unfollow
  };

  const handleMessage = async () => {
    try {
      // Add conversation first
      await communicationApi.addConversation(userId);
      console.log("✅ Conversation added successfully");

      // Navigate to messages page with userId
      navigate(`/messages?userId=${userId}`);
    } catch (error) {
      console.error("Failed to add conversation:", error);

      // Still navigate to messages page even if conversation already exists
      navigate(`/messages?userId=${userId}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
          {error || "Không tìm thấy người dùng"}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-semibold"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </button>

      {/* Profile Header */}
      <section
        className={`bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden ${
          profile.isPremium
            ? "border-2 border-transparent bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50"
            : ""
        }`}
      >
        {/* Premium Background Decoration */}
        {profile.isPremium && (
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
            {profile.isPremium && (
              <div
                className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-full animate-spin-slow opacity-75 group-hover:opacity-100 transition-opacity"
                style={{ animationDuration: "3s" }}
              />
            )}
            <div
              className={`relative ${
                profile.isPremium
                  ? "p-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-full"
                  : ""
              }`}
            >
              <img
                src={profile.avatarUrl}
                alt={`${profile.fullName} avatar`}
                className={`w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg ${
                  profile.isPremium ? "animate-pulse-glow" : ""
                }`}
              />
            </div>
            {/* Premium Crown Badge */}
            {profile.isPremium && (
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
                      profile.isPremium
                        ? "bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 bg-clip-text text-transparent"
                        : ""
                    }`}
                  >
                    {profile.fullName}
                  </h1>
                  {profile.isPremium && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white shadow-lg animate-pulse-glow">
                      <Crown className="w-3.5 h-3.5" />
                      <span>PREMIUM</span>
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                {profile.username && (
                  <p className="text-sm text-gray-500 mt-1">
                    @{profile.username}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-2">{profile.bio}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold">{profile.postsCount}</p>
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    Bài viết
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold">{profile.followersCount}</p>
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    Người theo dõi
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold">{profile.followingCount}</p>
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    Đang theo dõi
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleFollow}
                  className={`px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors ${
                    isFollowing
                      ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      : "bg-black text-white hover:bg-gray-900"
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" /> Đang theo dõi
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" /> Theo dõi
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleMessage}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> Nhắn tin
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Info */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4">Thông tin</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.email && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-800">
                {profile.email}
              </span>
            </div>
          )}
          {profile.createdAt && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-800">
                Tham gia{" "}
                {new Date(profile.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* User Posts */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4">Bài viết ({posts.length})</h2>
        {posts.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Người dùng này chưa có bài viết nào.
          </div>
        ) : (
          <PostList
            posts={posts.map((post) => ({
              ...post,
              user: profile.fullName,
              avatar: profile.avatarUrl,
            }))}
            userCache={{
              [userId]: {
                name: profile.fullName,
                avatar: profile.avatarUrl,
                isPremium: profile.isPremium,
                premiumOneMonth: profile.premiumOneMonth,
                premiumSixMonths: profile.premiumSixMonths,
              },
            }}
            onLikePost={() => {}}
            onNavigateAiTools={() => navigate("/ai-tools")}
          />
        )}
      </section>
    </div>
  );
};

export default UserProfile;

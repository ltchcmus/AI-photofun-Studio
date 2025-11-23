import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Globe,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  Sparkles,
} from "lucide-react";

const API_GATEWAY = import.meta.env.VITE_API_GATEWAY || "http://localhost:8888";
const PROFILE_ENDPOINT = "/api/v1/profiles/my-profile";
const POSTS_ENDPOINT = "/api/v1/posts/my-posts?page=1&size=5";

const PROFILE_DEFAULTS = {
  fullName: "",
  bio: "Digital artist · AI creative explorer",
  email: "",
  phone: "",
  avatarUrl: "",
  address: "123 Nguyễn Huệ Street, District 1, Ho Chi Minh City",
  country: "Vietnam",
  dob: "May 01, 2005",
  created: "November 12, 2025",
};

const profileStats = [
  { label: "Images Created", value: "128" },
  { label: "Followers", value: "2.5K" },
  { label: "Following", value: "428" },
];

const recentWorks = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&h=600&fit=crop",
];

const DEFAULT_POST_COVER =
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop";

const Profile = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
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
          throw new Error(data.message || "Failed to fetch profile");
        }

        setProfileData(data.result || data.data || data);
      } catch (fetchError) {
        setError(fetchError.message || "Không thể tải thông tin hồ sơ");
      } finally {
        setLoading(false);
      }
    };

    const fetchPosts = async () => {
      setPostsLoading(true);
      setPostsError("");
      try {
        const token = localStorage.getItem("token");
        const headers = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_GATEWAY}${POSTS_ENDPOINT}`, {
          method: "GET",
          headers,
          credentials: "include",
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch posts");
        }

        const rawPosts =
          data.result?.items ||
          data.result?.elements ||
          data.result?.content ||
          data.result?.data ||
          data.result ||
          data.data ||
          [];

        const normalizedPosts = (
          Array.isArray(rawPosts) ? rawPosts : [rawPosts]
        ).map((post, index) => ({
          id: post.id || post.postId || `post-${index}`,
          title: post.title || post.caption || "Bài viết không tiêu đề",
          content: post.caption || post.description || "",
          prompt: post.prompt || "",
          cover:
            post.imageUrl || post.image || post.coverUrl || DEFAULT_POST_COVER,
          stats: {
            likes: post.totalLikes ?? post.likeCount ?? post.likes ?? 0,
            comments:
              post.totalComments ?? post.commentCount ?? post.comments ?? 0,
            createdAt: post.createdAt || "Vừa xong",
          },
        }));

        setPosts(normalizedPosts);
      } catch (fetchError) {
        setPostsError(fetchError.message || "Không thể tải bài viết");
      } finally {
        setPostsLoading(false);
      }
    };

    fetchProfile();
    fetchPosts();
  }, []);

  const displayProfile = {
    fullName: profileData?.fullName ?? PROFILE_DEFAULTS.fullName,
    bio: profileData?.bio ?? PROFILE_DEFAULTS.bio,
    email: profileData?.email ?? PROFILE_DEFAULTS.email,
    phone: profileData?.phone ?? PROFILE_DEFAULTS.phone,
    avatarUrl: profileData?.avatarUrl ?? PROFILE_DEFAULTS.avatarUrl,
    address: profileData?.address ?? PROFILE_DEFAULTS.address,
    country: profileData?.country ?? PROFILE_DEFAULTS.country,
    dob: profileData?.dob ?? PROFILE_DEFAULTS.dob,
    created: profileData?.createdAt
      ? new Date(profileData.createdAt).toLocaleDateString()
      : PROFILE_DEFAULTS.created,
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

  const locationDetails = [
    {
      id: "address",
      label: "Address",
      value: displayProfile.address,
      icon: MapPin,
    },
    {
      id: "country",
      label: "Country",
      value: displayProfile.country,
      icon: Globe,
    },
  ];

  const personalDetails = [
    {
      id: "dob",
      label: "Date of Birth",
      value: displayProfile.dob,
      icon: Calendar,
    },
    {
      id: "created",
      label: "Account Created",
      value: displayProfile.created,
      icon: Clock,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {loading && (
        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-600">
          Đang tải thông tin hồ sơ...
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <img
            src={displayProfile.avatarUrl}
            alt={`${displayProfile.fullName} avatar`}
            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-inner"
          />

          <div className="flex-1 w-full">
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-3xl font-bold">
                  {displayProfile.fullName}
                </h1>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <h2 className="text-lg font-bold mb-4">Location</h2>
          <div className="space-y-4">
            {locationDetails.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id}>
                  <p className="text-xs uppercase text-gray-500 font-semibold mb-2">
                    {item.label}
                  </p>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Icon className="w-5 h-5 text-gray-600 mt-0.5" />
                    <span className="text-sm font-medium text-gray-800">
                      {item.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personalDetails.map((item) => {
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
        {posts.length === 0 && !postsLoading && !postsError && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-600 text-center">
            Bạn chưa có bài viết nào. Tạo bài đầu tiên ở mục dashboard nhé!
          </div>
        )}
        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="border border-gray-200 rounded-2xl p-4 md:p-5 hover:border-gray-300 transition-colors"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {post.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {post.stats.createdAt}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{post.content}</p>
                  <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                      <Sparkles className="w-4 h-4 text-purple-500" /> Prompt
                    </div>
                    {post.prompt ? (
                      <p className="mt-2 text-xs text-gray-600 font-mono leading-relaxed">
                        {post.prompt}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-gray-400 italic">
                        Chưa cập nhật prompt
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-pink-500" />
                      {post.stats.likes.toLocaleString()} likes
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                      {post.stats.comments} comments
                    </span>
                  </div>
                </div>
                <div className="w-full md:w-56 shrink-0">
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <img
                      src={post.cover}
                      alt={post.title}
                      className="w-full h-40 object-cover"
                    />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Profile;

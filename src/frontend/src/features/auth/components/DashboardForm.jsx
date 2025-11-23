import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Image,
  MessageCircle,
  MoreHorizontal,
  Sparkles,
  X,
} from "lucide-react";

const API_GATEWAY = import.meta.env.VITE_API_GATEWAY || "http://localhost:8888";
const FEED_ENDPOINT = "/api/v1/posts/get-all?page=1&size=20";
const CREATE_ENDPOINT = "/api/v1/posts/create";
const DEFAULT_AVATAR = "https://placehold.co/40x40/111/fff?text=U";
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop";
const formatTimestamp = (value) => {
  if (!value) return "Vừa xong";
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? value : new Date(parsed).toLocaleString();
};

const normalizePost = (post, index = 0) => {
  if (!post) return null;

  const author = post.author || post.user || post.owner || post.createdBy || {};
  const name =
    author.username ||
    author.fullName ||
    author.name ||
    post.username ||
    post.ownerName ||
    "Unknown artist";

  return {
    id: post.id || post.postId || `post-${index}`,
    user: name,
    avatar:
      author.avatarUrl || author.avatar || post.avatarUrl || DEFAULT_AVATAR,
    time: formatTimestamp(
      post.createdAt || post.createdDate || post.created_time
    ),
    content: post.caption || post.description || post.content || "",
    image:
      post.imageUrl ||
      post.image ||
      post.coverUrl ||
      post.mediaUrl ||
      DEFAULT_IMAGE,
    likes: post.totalLikes ?? post.likeCount ?? post.likes ?? 0,
    comments: post.totalComments ?? post.commentCount ?? post.comments ?? 0,
    liked: Boolean(post.liked ?? post.isLiked ?? false),
    hasPrompt: Boolean(post.prompt),
    prompt: post.prompt || "",
  };
};

export default function DashboardForm() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [postImageFile, setPostImageFile] = useState(null);
  const [promptText, setPromptText] = useState("");
  const [feedPosts, setFeedPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [creatingPost, setCreatingPost] = useState(false);
  const [createError, setCreateError] = useState("");
  const fileInputRef = useRef(null);
  const isMountedRef = useRef(true);

  const fetchFeed = useCallback(async () => {
    if (!isMountedRef.current) return;

    setFeedLoading(true);
    setFeedError("");
    try {
      const token = localStorage.getItem("token");
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_GATEWAY}${FEED_ENDPOINT}`, {
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

      const normalizedPosts = (Array.isArray(rawPosts) ? rawPosts : [rawPosts])
        .map((post, index) => normalizePost(post, index))
        .filter(Boolean);

      if (isMountedRef.current) {
        setFeedPosts(normalizedPosts);
      }
    } catch (fetchError) {
      if (isMountedRef.current) {
        setFeedError(fetchError.message || "Không thể tải danh sách bài viết");
      }
    } finally {
      if (isMountedRef.current) {
        setFeedLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchFeed();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchFeed]);

  function handleCreateClick() {
    setShowCreateModal(true);
    setPromptText("");
    setCreateError("");
  }

  function handleCloseModal() {
    setShowCreateModal(false);
    setPostContent("");
    setPostImage(null);
    setPostImageFile(null);
    setPromptText("");
    setCreateError("");
  }

  function handleImageUpload() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (postImage) {
      URL.revokeObjectURL(postImage);
    }

    const previewUrl = URL.createObjectURL(file);
    setPostImage(previewUrl);
    setPostImageFile(file);
  }

  function handleRemoveImage() {
    if (postImage) {
      URL.revokeObjectURL(postImage);
    }
    setPostImage(null);
    setPostImageFile(null);
  }

  useEffect(() => {
    return () => {
      if (postImage) {
        URL.revokeObjectURL(postImage);
      }
    };
  }, [postImage]);

  async function handleSubmit() {
    if (creatingPost) return;
    if (!postContent && !postImageFile) {
      setCreateError("Vui lòng nhập nội dung hoặc chọn ảnh.");
      return;
    }

    setCreateError("");
    setCreatingPost(true);

    try {
      const token = localStorage.getItem("token");
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const formData = new FormData();
      formData.append("caption", postContent || "");
      formData.append("prompt", promptText || "");
      if (postImageFile) {
        formData.append("image", postImageFile);
      }

      const response = await fetch(`${API_GATEWAY}${CREATE_ENDPOINT}`, {
        method: "POST",
        headers,
        body: formData,
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create post");
      }

      const createdPost =
        data.result?.item ||
        data.result?.data ||
        data.result ||
        data.data ||
        data.post ||
        data;

      const normalized = normalizePost(createdPost, Date.now());
      if (normalized) {
        setFeedPosts((prev) => [normalized, ...prev]);
      }

      handleCloseModal();
    } catch (error) {
      setCreateError(error.message || "Không thể tạo bài viết");
    } finally {
      if (isMountedRef.current) {
        setCreatingPost(false);
      }
    }
  }

  return (
    <div className="h-full w-full">
      <header className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-200 z-10">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-8">
            <button className="text-sm font-semibold text-black relative">
              For you
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-black rounded-full" />
            </button>
            <button className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Friends
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-6 pb-24">
        <section className="border-b border-gray-200 py-4">
          <div className="flex gap-3 items-center">
            <img
              src="https://placehold.co/48x48/111/fff?text=U"
              alt="Your avatar"
              className="w-12 h-12 rounded-full bg-gray-200 shrink-0"
            />
            <button
              type="button"
              onClick={handleCreateClick}
              className="flex-1 text-left text-gray-500 border border-gray-200 rounded-full py-3 px-4 hover:bg-gray-50"
            >
              Share something inspiring...
            </button>
            <button
              type="button"
              className="p-2 -m-2 hover:bg-gray-100 rounded-full text-gray-500"
              onClick={handleCreateClick}
            >
              <Image className="w-5 h-5" />
            </button>
          </div>
        </section>

        <section>
          {feedLoading && (
            <div className="border border-gray-200 bg-gray-50 text-gray-600 text-sm rounded-xl px-4 py-3 mb-4">
              Đang tải bài viết...
            </div>
          )}
          {feedError && (
            <div className="border border-red-200 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {feedError}
            </div>
          )}
          {feedPosts.length === 0 && !feedLoading && !feedError && (
            <div className="border border-gray-200 bg-gray-50 text-gray-600 text-sm rounded-xl px-4 py-5 text-center">
              Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ cảm hứng!
            </div>
          )}
          {feedPosts.map((post) => (
            <article key={post.id} className="border-b border-gray-200 py-6">
              <div className="flex gap-3">
                <img
                  src={post.avatar}
                  alt={`${post.user} avatar`}
                  className="w-10 h-10 rounded-full shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        {post.user}
                      </p>
                      <p className="text-xs text-gray-500">{post.time}</p>
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenu(activeMenu === post.id ? null : post.id)
                        }
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                        title="Options"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      {activeMenu === post.id && (
                        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-lg z-20">
                          <button className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50">
                            Save
                          </button>
                          <button className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50">
                            Hide
                          </button>
                          <button className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-gray-50">
                            Report
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-800 mt-3">{post.content}</p>

                  {post.image && (
                    <div className="rounded-2xl overflow-hidden border border-gray-200 mt-4">
                      <img
                        src={post.image}
                        alt={`Post by ${post.user}`}
                        className="w-full h-auto object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {post.hasPrompt && (
                    <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                        <Sparkles className="w-4 h-4 text-purple-500" /> AI
                        Prompt
                      </div>
                      <p className="mt-2 text-xs text-gray-600 font-mono leading-relaxed">
                        {post.prompt}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-6 mt-4">
                    <button
                      type="button"
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-500"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          post.liked ? "fill-red-500 text-red-500" : ""
                        }`}
                      />
                      {Number(post.likes || 0).toLocaleString()}
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-500"
                    >
                      <MessageCircle className="w-5 h-5" />
                      {Number(post.comments || 0).toLocaleString()}
                    </button>
                    <button
                      type="button"
                      className="text-sm text-purple-600 hover:text-purple-700"
                      onClick={() => navigate("/ai-tools")}
                    >
                      Use AI tools
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      {showCreateModal && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={handleCloseModal}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Create post</h2>
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded-full"
                  onClick={handleCloseModal}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto">
                <textarea
                  value={postContent}
                  onChange={(event) => setPostContent(event.target.value)}
                  placeholder="Share your artwork or process..."
                  className="w-full resize-none outline-none text-base text-gray-800 placeholder-gray-500"
                  rows={4}
                />

                {postImage && (
                  <div className="relative mt-4">
                    <img
                      src={postImage}
                      alt="Preview"
                      className="w-full rounded-xl border border-gray-200"
                    />
                    <button
                      type="button"
                      className="absolute top-3 right-3 p-1.5 bg-black/70 rounded-full text-white"
                      onClick={handleRemoveImage}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-600"
                    onClick={handleImageUpload}
                  >
                    <Image className="w-4 h-4" />
                    Upload image
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 border border-purple-200 rounded-xl text-sm font-medium text-purple-600"
                    onClick={() => navigate("/ai-tools")}
                  >
                    Create with AI
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="mt-6">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    <Sparkles className="w-4 h-4 text-purple-500" /> Prompt đã
                    dùng (tuỳ chọn)
                  </label>
                  <textarea
                    value={promptText}
                    onChange={(event) => setPromptText(event.target.value)}
                    placeholder="Nhập prompt bạn đã dùng để tạo ảnh..."
                    className="mt-3 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-mono text-gray-700 focus:ring-2 focus:ring-purple-200"
                    rows={3}
                  />
                </div>

                {createError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {createError}
                  </div>
                )}
              </div>

              <div className="px-5 py-4 border-t border-gray-200">
                <button
                  type="button"
                  className="w-full py-3 rounded-xl bg-black text-white font-semibold disabled:opacity-50"
                  onClick={handleSubmit}
                  disabled={(!postContent && !postImageFile) || creatingPost}
                >
                  {creatingPost ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

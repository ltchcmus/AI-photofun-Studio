import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Heart,
  Loader2,
  MoreHorizontal,
  Send,
  Smile,
  Edit2,
  Trash2,
  MessageCircle,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { commentApi } from "../../api/commentApi";
import { userApi } from "../../api/userApi";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop";

const buildCurrentUser = (user) => ({
  id: user?.id || user?.userId,
  name: user?.fullName || user?.username || user?.email || "Bạn",
  avatar: user?.avatar || user?.avatarUrl || DEFAULT_AVATAR,
  isPremium: Boolean(
    user?.isPremium ||
      user?.premium ||
      user?.premiumOneMonth ||
      user?.premiumSixMonths
  ),
});

const formatRelativeTime = (value) => {
  if (!value) return "Vừa xong";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return date.toLocaleDateString();
};

const extractUserInfo = (payload) => ({
  name:
    payload?.fullName ||
    payload?.username ||
    payload?.displayName ||
    payload?.email ||
    "Người dùng",
  avatar:
    payload?.avatarUrl ||
    payload?.avatar ||
    payload?.profileImage ||
    DEFAULT_AVATAR,
  isPremium: Boolean(
    payload?.isPremium ||
      payload?.premium ||
      payload?.premiumOneMonth ||
      payload?.premiumSixMonths
  ),
});

const parseApiData = (response) =>
  response?.data?.result?.data ||
  response?.data?.result?.items ||
  response?.data?.result ||
  response?.data?.data ||
  response?.data ||
  [];

const SOCKET_URL = "ws://localhost:8003/ws";

export default function CommentSection({ postId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const socketRef = useRef(null);

  const currentUser = useMemo(() => buildCurrentUser(user), [user]);

  useEffect(() => {
    let isMounted = true;

    const fetchComments = async () => {
      if (!postId) return;
      console.log("[CommentSection] Fetching comments for post", postId);
      setLoading(true);
      setError("");

      try {
        const response = await commentApi.getCommentsByPost(postId);
        console.log("[CommentSection] Comments API response", response?.data);
        const rawComments = parseApiData(response);
        const commentsArray = Array.isArray(rawComments) ? rawComments : [];
        const uniqueUserIds = Array.from(
          new Set(
            commentsArray
              .map((comment) => comment.userId)
              .filter((userId) => Boolean(userId))
          )
        );

        const userEntries = await Promise.all(
          uniqueUserIds.map(async (userId) => {
            try {
              const userResponse = await userApi.getUserById(userId);
              console.log(
                `[CommentSection] User API response for ${userId}`,
                userResponse?.data
              );
              // API returns { result: { ...user } }, so we extract result directly
              const userData = userResponse?.data?.result;
              return [userId, extractUserInfo(userData)];
            } catch (fetchUserError) {
              console.error("Failed to load user info", fetchUserError);
              return [userId, extractUserInfo(null)];
            }
          })
        );

        const userMap = Object.fromEntries(userEntries);

        const normalizedComments = commentsArray.map((comment) => ({
          id: comment?.id || comment?._id || String(Date.now()),
          userId: comment?.userId,
          user: userMap[comment?.userId] || {
            name: comment?.userName || "Người dùng",
            avatar: DEFAULT_AVATAR,
            isPremium: false,
          },
          content: comment?.content || "",
          time: formatRelativeTime(comment?.createdAt || comment?.updatedAt),
          likes: comment?.likes ?? 0,
          isLiked: false,
        }));

        if (isMounted) {
          setComments(normalizedComments);
        }
      } catch (fetchError) {
        console.error("Failed to fetch comments", fetchError);
        if (isMounted) {
          setError(
            fetchError?.response?.data?.message ||
              fetchError?.message ||
              "Không thể tải bình luận"
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchComments();

    return () => {
      isMounted = false;
    };
  }, [postId]);

  useEffect(() => {
    if (!postId || socketRef.current) return undefined;

    let ws = null;

    try {
      ws = new WebSocket(SOCKET_URL);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("✅ WebSocket connected");
        try {
          ws.send(JSON.stringify({ type: "join", room: postId }));
        } catch (err) {
          console.error("Failed to send join message:", err);
        }
      };

      ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case "new_comment": {
              const payload = message.data;
              if (!payload || (payload.postId && payload.postId !== postId))
                return;

              let userInfo = {
                name: payload?.userName || "Người dùng",
                avatar: DEFAULT_AVATAR,
                isPremium: false,
              };

              if (payload?.userId) {
                try {
                  const userResponse = await userApi.getUserById(
                    payload.userId
                  );
                  userInfo = extractUserInfo(userResponse?.data?.result);
                } catch (userError) {
                  console.error("Failed to fetch user info", userError);
                }
              }

              const normalized = {
                id: payload?.id || payload?._id || String(Date.now()),
                userId: payload?.userId,
                user: userInfo,
                content: payload?.content || "",
                time: formatRelativeTime(
                  payload?.createdAt || payload?.updatedAt
                ),
                likes: payload?.likes ?? 0,
                isLiked: false,
                isNew: true,
              };

              setComments((prev) => {
                const exists = prev.some(
                  (comment) => String(comment.id) === String(normalized.id)
                );
                if (exists) return prev;
                return [...prev, normalized];
              });

              setTimeout(() => {
                setComments((prev) =>
                  prev.map((c) =>
                    c.id === normalized.id ? { ...c, isNew: false } : c
                  )
                );
              }, 3000);
              break;
            }

            case "update_comment": {
              const payload = message.data;
              setComments((prev) =>
                prev.map((c) =>
                  c.id === payload.id
                    ? {
                        ...c,
                        content: payload.content,
                        time: formatRelativeTime(payload.updatedAt),
                      }
                    : c
                )
              );
              break;
            }

            case "delete_comment": {
              const payload = message.data;
              setComments((prev) => prev.filter((c) => c.id !== payload.id));
              break;
            }

            default:
              break;
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        console.log("❌ WebSocket closed");
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }

    return () => {
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        try {
          socketRef.current.send(
            JSON.stringify({ type: "leave", room: postId })
          );
        } catch (err) {
          console.error("Failed to send leave message:", err);
        }
        socketRef.current.close();
      }
      socketRef.current = null;
    };
  }, [postId]);

  const handleSend = async () => {
    const content = newComment.trim();
    if (!content || !postId || !currentUser.id) return;

    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        postId,
        userId: currentUser.id,
        userName: currentUser.name,
        content,
      };

      const response = await commentApi.createComment(payload);
      const created = parseApiData(response);

      const normalized = {
        id: created?.id || created?._id || String(Date.now()),
        userId: currentUser.id,
        user: currentUser,
        content: created?.content || content,
        time: formatRelativeTime(
          created?.createdAt || new Date().toISOString()
        ),
        likes: created?.likes ?? 0,
        isLiked: false,
      };

      setComments((prev) => {
        const exists = prev.some(
          (comment) => String(comment.id) === String(normalized.id)
        );
        if (exists) return prev;
        return [...prev, normalized];
      });
      setNewComment("");
    } catch (createError) {
      console.error("Failed to create comment", createError);
      setError(
        createError?.response?.data?.message ||
          createError?.message ||
          "Không thể gửi bình luận"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLike = (commentId) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              isLiked: !comment.isLiked,
              likes: Math.max(0, comment.likes + (comment.isLiked ? -1 : 1)),
            }
          : comment
      )
    );
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
    setMenuOpenId(null);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editContent.trim()) return;

    setIsSubmitting(true);
    setError("");

    try {
      await commentApi.updateComment(commentId, { content: editContent });
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, content: editContent, time: "Vừa xong" }
            : c
        )
      );
      setEditingCommentId(null);
      setEditContent("");
    } catch (updateError) {
      console.error("Failed to update comment", updateError);
      setError("Không thể cập nhật bình luận");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Bạn có chắc muốn xóa bình luận này?")) return;

    setError("");

    try {
      await commentApi.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setMenuOpenId(null);
    } catch (deleteError) {
      console.error("Failed to delete comment", deleteError);
      setError("Không thể xóa bình luận");
    }
  };

  const handleReply = (commentId) => {
    setReplyingToId(commentId);
    setReplyContent("");
    setMenuOpenId(null);
  };

  const handleSendReply = async (parentCommentId) => {
    if (!replyContent.trim() || !postId || !currentUser.id) return;

    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        postId,
        userId: currentUser.id,
        userName: currentUser.name,
        content: replyContent,
        parentId: parentCommentId,
      };

      const response = await commentApi.createComment(payload);
      const created = parseApiData(response);

      const normalized = {
        id: created?.id || created?._id || String(Date.now()),
        userId: currentUser.id,
        user: currentUser,
        content: created?.content || replyContent,
        time: formatRelativeTime(
          created?.createdAt || new Date().toISOString()
        ),
        likes: created?.likes ?? 0,
        isLiked: false,
      };

      setComments((prev) => [...prev, normalized]);
      setReplyingToId(null);
      setReplyContent("");
    } catch (replyError) {
      console.error("Failed to send reply", replyError);
      setError("Không thể gửi trả lời");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!postId) {
    return (
      <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        Không tìm thấy mã bài viết để tải bình luận.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Bình luận ({comments.length})
        </h3>
      </div>

      {error && (
        <div className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          Lỗi tải bình luận: {error}
        </div>
      )}

      <div className="max-h-72 space-y-5 overflow-y-auto px-4 py-4 text-sm">
        {loading && (
          <div className="flex justify-center py-6 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {!loading && !comments.length && !error && (
          <div className="py-4 text-center text-sm text-gray-500">
            Chưa có bình luận nào. Hãy là người đầu tiên!
          </div>
        )}

        {!loading &&
          !error &&
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`flex gap-3 rounded-xl p-3 transition-all ${
                comment.isNew
                  ? "bg-green-50 border-2 border-green-200"
                  : "bg-gray-50/70"
              }`}
            >
              <img
                src={comment.user.avatar}
                alt={comment.user.name}
                className={`h-10 w-10 rounded-full object-cover ${
                  comment.user.isPremium
                    ? "ring-2 ring-yellow-400 ring-offset-2"
                    : ""
                }`}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {comment.user.name}
                  </span>
                  {comment.user.isPremium && (
                    <span className="rounded-full border border-yellow-200 bg-yellow-100 px-2 text-[10px] font-semibold text-yellow-700">
                      PRO
                    </span>
                  )}
                  {comment.isNew && (
                    <span className="rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      MỚI
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{comment.time}</span>
                </div>

                {editingCommentId === comment.id ? (
                  <div className="mt-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      rows={2}
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={isSubmitting}
                        className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        Lưu
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditContent("");
                        }}
                        className="rounded-lg bg-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-400"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-gray-700">{comment.content}</p>
                )}

                <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                  <button
                    type="button"
                    onClick={() => toggleLike(comment.id)}
                    className={`flex items-center gap-1 transition-colors hover:text-red-500 ${
                      comment.isLiked ? "text-red-500" : ""
                    }`}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        comment.isLiked ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                    {comment.likes > 0 ? `${comment.likes} thích` : "Thích"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReply(comment.id)}
                    className="flex items-center gap-1 text-gray-500 transition-colors hover:text-blue-500"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Trả lời
                  </button>
                  {comment.userId === currentUser.id && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setMenuOpenId(
                            menuOpenId === comment.id ? null : comment.id
                          )
                        }
                        className="rounded-full p-1 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {menuOpenId === comment.id && (
                        <div className="absolute left-0 z-10 mt-1 w-32 rounded-lg border border-gray-200 bg-white shadow-lg">
                          <button
                            type="button"
                            onClick={() => handleEditComment(comment)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50"
                          >
                            <Edit2 className="h-3 w-3" />
                            Chỉnh sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-gray-50"
                          >
                            <Trash2 className="h-3 w-3" />
                            Xóa
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {replyingToId === comment.id && (
                  <div className="mt-3 flex gap-2">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Viết trả lời..."
                        className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        rows={2}
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSendReply(comment.id)}
                          disabled={isSubmitting || !replyContent.trim()}
                          className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Gửi"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToId(null);
                            setReplyContent("");
                          }}
                          className="rounded-lg bg-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-400"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => toggleLike(comment.id)}
                className="self-start rounded-full p-1 text-gray-300 transition hover:bg-red-50 hover:text-red-500"
                aria-label="Toggle comment like"
              >
                <Heart
                  className={`h-4 w-4 ${
                    comment.isLiked ? "fill-red-500 text-red-500" : ""
                  }`}
                />
              </button>
            </div>
          ))}
      </div>

      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="h-9 w-9 rounded-full object-cover"
          />
          <div className="relative flex-1">
            <input
              type="text"
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                currentUser.id ? "Viết bình luận..." : "Đăng nhập để bình luận"
              }
              disabled={!currentUser.id || isSubmitting}
              className="w-full rounded-full border border-transparent bg-gray-100 py-2.5 pl-4 pr-16 text-sm text-gray-700 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
            />
            <div className="pointer-events-none absolute inset-y-0 right-10 flex items-center text-gray-400">
              <Smile className="h-4 w-4" />
            </div>
            <button
              type="button"
              onClick={handleSend}
              disabled={!newComment.trim() || !currentUser.id || isSubmitting}
              className="absolute inset-y-0 right-2 flex items-center rounded-full p-1.5 text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Gửi bình luận"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

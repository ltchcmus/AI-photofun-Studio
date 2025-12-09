import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { postApi } from "../api/postApi";
import { userApi } from "../api/userApi";
import { useAuth } from "./useAuth";

const DEFAULT_AVATAR = "https://placehold.co/40x40/111/fff?text=U";
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop";

const formatTimestamp = (value) => {
  if (!value) return "Vừa xong";
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? value : new Date(parsed).toLocaleString();
};

const extractBackendId = (post) =>
  post?.backendId ||
  post?.postId ||
  post?.postID ||
  post?.id ||
  post?.originalId ||
  post?.contentId ||
  null;

const normalizePost = (post, index = 0) => {
  if (!post) return null;

  const author = post.author || post.user || post.owner || post.createdBy || {};
  const promptValue = typeof post.prompt === "string" ? post.prompt.trim() : "";
  const userId =
    post.userId || post.userID || post.ownerId || post.authorId || author.id;
  const name =
    author.username ||
    author.fullName ||
    author.name ||
    post.username ||
    post.ownerName ||
    "Unknown artist";
  const backendId = extractBackendId(post);
  const clientId =
    post.clientId ||
    post.localId ||
    post.tempId ||
    backendId ||
    `post-${index}`;

  return {
    id: clientId,
    backendId,
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
    hasPrompt: Boolean(promptValue),
    prompt: promptValue,
    userId,
  };
};

export const usePosts = (options = {}) => {
  const normalizedOptions =
    typeof options === "boolean"
      ? { scope: options ? "my" : "feed" }
      : options || {};

  const isMyPosts = Boolean(
    normalizedOptions.isMyPosts ||
      normalizedOptions.scope === "my" ||
      normalizedOptions.scope === "my-posts"
  );
  const scope = isMyPosts ? "my" : normalizedOptions.scope || "feed";
  const page = normalizedOptions.page ?? 1;
  const size = normalizedOptions.size ?? 20;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingLikes, setPendingLikes] = useState({});
  const [userCache, setUserCache] = useState({});
  const pendingUsersRef = useRef(new Set());
  const { user: authUser } = useAuth();

  const fetchLikedStatus = useCallback(
    async (postList = []) => {
      if (!authUser?.id) return {};

      const backendIds = Array.from(
        new Set(
          postList
            .map((post) => post.backendId || post.id)
            .filter((id) => typeof id === "string" && id.trim())
        )
      );

      if (!backendIds.length) return {};

      try {
        const response = await postApi.checkLikedPosts(backendIds);
        const rawResult =
          response.data?.result?.data ||
          response.data?.result?.items ||
          response.data?.result ||
          response.data?.data ||
          response.data ||
          {};

        if (Array.isArray(rawResult)) {
          return rawResult.reduce((acc, entry) => {
            if (!entry) return acc;
            if (typeof entry === "string") {
              acc[entry] = true;
              return acc;
            }

            const key =
              entry.postId ||
              entry.postID ||
              entry.id ||
              entry.backendId ||
              entry.contentId;
            if (key) {
              acc[key] = Boolean(
                entry.liked ??
                  entry.isLiked ??
                  entry.value ??
                  entry.status ??
                  true
              );
            }
            return acc;
          }, {});
        }

        if (rawResult && typeof rawResult === "object") {
          return Object.entries(rawResult).reduce((acc, [key, value]) => {
            if (key) acc[key] = Boolean(value);
            return acc;
          }, {});
        }

        return {};
      } catch (likedError) {
        console.error("Failed to fetch liked status", likedError);
        return {};
      }
    },
    [authUser?.id]
  );

  const fetchAuthors = useCallback(
    async (postList) => {
      const idsToFetch = postList
        .map((post) => post.userId)
        .filter(
          (id) => id && !userCache[id] && !pendingUsersRef.current.has(id)
        );

      if (!idsToFetch.length) return;

      await Promise.all(
        idsToFetch.map(async (id) => {
          try {
            pendingUsersRef.current.add(id);
            const response = await userApi.getUserById(id);
            const data =
              response.data?.result?.data ||
              response.data?.result ||
              response.data?.data ||
              response.data?.user ||
              response.data;

            setUserCache((prev) => ({
              ...prev,
              [id]: {
                name:
                  data?.fullName ||
                  data?.username ||
                  data?.email ||
                  "Người dùng",
                avatar:
                  data?.avatarUrl ||
                  data?.avatar ||
                  data?.profileImage ||
                  DEFAULT_AVATAR,
                // Premium status
                isPremium: Boolean(
                  data?.isPremium ||
                    data?.premium ||
                    data?.premiumOneMonth ||
                    data?.premiumSixMonths
                ),
                premiumOneMonth: Boolean(data?.premiumOneMonth),
                premiumSixMonths: Boolean(data?.premiumSixMonths),
              },
            }));
          } catch (authorError) {
            console.error("Failed to fetch author", authorError);
          } finally {
            pendingUsersRef.current.delete(id);
          }
        })
      );
    },
    [userCache]
  );

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response =
        scope === "feed"
          ? await postApi.getFeed({ page, size })
          : await postApi.getMyPosts({ page, size });

      const rawData =
        response.data?.result?.items ||
        response.data?.result?.elements ||
        response.data?.result?.content ||
        response.data?.result?.data ||
        response.data?.result ||
        response.data?.data ||
        [];

      const normalized = (Array.isArray(rawData) ? rawData : [rawData])
        .map((post, index) => normalizePost(post, index))
        .filter(Boolean);

      const likedMap = await fetchLikedStatus(normalized);
      const enrichedPosts = normalized.map((post) => {
        const likeKey = post.backendId || post.id;
        if (!likeKey) return post;
        if (Object.prototype.hasOwnProperty.call(likedMap, likeKey)) {
          return { ...post, liked: Boolean(likedMap[likeKey]) };
        }
        return post;
      });

      setPosts(enrichedPosts);
      fetchAuthors(enrichedPosts);
    } catch (fetchError) {
      setError(fetchError?.message || "Không thể tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  }, [fetchAuthors, fetchLikedStatus, page, scope, size]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (!authUser?.id) return;

    setUserCache((prev) => {
      if (prev[authUser.id]) return prev;
      return {
        ...prev,
        [authUser.id]: {
          name: authUser.fullName || authUser.email || "Bạn",
          avatar: authUser.avatar || DEFAULT_AVATAR,
        },
      };
    });
  }, [authUser]);

  const createPost = useCallback(
    async ({ caption, prompt, image }) => {
      const formData = new FormData();
      formData.append("caption", caption || "");
      if (prompt?.trim()) {
        formData.append("prompt", prompt.trim());
      }
      if (image) {
        formData.append("image", image);
      }

      const response = await postApi.createPost(formData);
      const result =
        response.data?.result?.item ||
        response.data?.result?.data ||
        response.data?.result ||
        response.data?.data ||
        response.data.post ||
        response.data;

      const normalized = normalizePost(result, Date.now());
      if (normalized) {
        setPosts((prev) => [normalized, ...prev]);
        fetchAuthors([normalized]);
      }

      return normalized;
    },
    [fetchAuthors]
  );

  const handleLike = useCallback(
    async (postId) => {
      if (!postId || pendingLikes[postId]) return;

      const targetPost = posts.find((post) => post.id === postId);
      if (!targetPost) return;

      const backendId = targetPost.backendId || targetPost.id;
      if (!backendId) {
        console.warn("Skipping like: missing backend id", targetPost);
        return;
      }

      const prevLiked = Boolean(targetPost.liked);
      const prevLikes = Number(targetPost.likes || 0);
      const nextLiked = !prevLiked;
      const nextLikes = Math.max(0, prevLikes + (nextLiked ? 1 : -1));

      setPendingLikes((prev) => ({ ...prev, [postId]: true }));
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                liked: nextLiked,
                likes: nextLikes,
              }
            : post
        )
      );

      try {
        await postApi.likePost(backendId);
      } catch (likeError) {
        console.error("Failed to toggle like", likeError);
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  liked: prevLiked,
                  likes: prevLikes,
                }
              : post
          )
        );
      } finally {
        setPendingLikes((prev) => {
          const next = { ...prev };
          delete next[postId];
          return next;
        });
      }
    },
    [pendingLikes, posts]
  );

  return useMemo(
    () => ({
      posts,
      loading,
      error,
      refresh: fetchPosts,
      createPost,
      handleLike,
      currentUser: authUser,
      userCache,
    }),
    [
      createPost,
      authUser,
      error,
      fetchPosts,
      handleLike,
      loading,
      posts,
      userCache,
    ]
  );
};

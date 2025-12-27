import React from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import CreatePostWidget from "../../../components/post/CreatePostWidget";
import PostList from "../../../components/post/PostList";
import { usePosts } from "../../../hooks/usePosts";

export default function DashboardForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const shouldOpenCreateModal = searchParams.get("create") === "true";

  // Nhận video URL và prompt từ ImageToVideo page khi share
  const shareVideo = location.state?.shareVideo;
  const initialVideoUrl = shareVideo?.videoUrl || null;
  const initialPrompt = shareVideo?.prompt || "";
  const autoOpenForShare = Boolean(shareVideo);

  const {
    posts,
    loading,
    error,
    createPost,
    createVideoPost,
    handleLike,
    currentUser,
    userCache,
  } = usePosts();

  const goToAiTools = () => navigate("/ai-tools");

  // Clear location state after reading
  const handleCloseModal = () => {
    if (shareVideo) {
      // Clear state to prevent re-opening on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  };

  return (
    <div className="h-full w-full">
      <header className="fixed top-0 left-0 md:left-20 right-0 bg-white/95 backdrop-blur border-b border-gray-200 z-50">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-8">
            <button className="text-sm font-semibold text-black relative">
              For you
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-black rounded-full" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-6 pb-24 pt-16">
        <section className="border-b border-gray-200 py-4">
          <CreatePostWidget
            currentUser={currentUser}
            onCreatePost={createPost}
            onCreateVideoPost={createVideoPost}
            onNavigateAiTools={goToAiTools}
            autoOpen={shouldOpenCreateModal || autoOpenForShare}
            initialVideoUrl={initialVideoUrl}
            initialPrompt={initialPrompt}
            onClose={handleCloseModal}
          />
        </section>

        <section className="pt-4">
          {error && (
            <div className="border border-red-200 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}
          {!loading && posts.length === 0 && (
            <div className="border border-gray-200 bg-gray-50 text-gray-600 text-sm rounded-xl px-4 py-5 text-center">
              Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ cảm hứng!
            </div>
          )}
          <PostList
            posts={posts}
            userCache={userCache}
            onLikePost={handleLike}
            onNavigateAiTools={goToAiTools}
          />
        </section>
      </main>
    </div>
  );
}


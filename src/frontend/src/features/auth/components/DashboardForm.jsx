import React from "react";
import { useNavigate } from "react-router-dom";
import CreatePostWidget from "../../../components/post/CreatePostWidget";
import PostList from "../../../components/post/PostList";
import { usePosts } from "../../../hooks/usePosts";

export default function DashboardForm() {
  const navigate = useNavigate();
  const {
    posts,
    loading,
    error,
    createPost,
    handleLike,
    currentUser,
    userCache,
  } = usePosts();

  const goToAiTools = () => navigate("/ai-tools");

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
            onNavigateAiTools={goToAiTools}
          />
        </section>

        <section>
          {loading && (
            <div className="border border-gray-200 bg-gray-50 text-gray-600 text-sm rounded-xl px-4 py-3 mb-4">
              Đang tải bài viết...
            </div>
          )}
          {error && (
            <div className="border border-red-200 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}
          {!loading && !error && posts.length === 0 && (
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

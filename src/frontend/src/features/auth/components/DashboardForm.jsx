import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Image,
  MessageCircle,
  MoreHorizontal,
  Sparkles,
  X,
} from "lucide-react";

export default function DashboardForm() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptText, setPromptText] = useState("");

  const posts = useMemo(
    () => [
      {
        id: 1,
        user: "alex_chen",
        avatar: "https://placehold.co/40x40/e2e8f0/64748b?text=A",
        time: "3h ago",
        content:
          "Cyberpunk cityscape at sunset 🌆. Experimenting with a new AI model, the results are impressive!",
        image:
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=600&fit=crop&q=80",
        likes: 8234,
        comments: 72,
        liked: false,
        hasPrompt: true,
        prompt:
          "Cyberpunk city at sunset, neon lights, flying cars, detailed architecture, cinematic lighting, 8k resolution",
      },
      {
        id: 2,
        user: "noah.design",
        avatar: "https://placehold.co/40x40/f1f5f9/475569?text=N",
        time: "6h ago",
        content:
          "AI-assisted matte painting workflow breakdown — layer masks and custom diffusion nodes.",
        image: null,
        likes: 1298,
        comments: 18,
        liked: true,
        hasPrompt: false,
      },
    ],
    []
  );

  function handleCreateClick() {
    setShowCreateModal(true);
    setShowPrompt(false);
    setPromptText("");
  }

  function handleCloseModal() {
    setShowCreateModal(false);
    setPostContent("");
    setPostImage(null);
    setShowPrompt(false);
    setPromptText("");
  }

  function handleImageUpload() {
    setPostImage(
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=600&fit=crop&q=80"
    );
  }

  function handleSubmit() {
    // Wire this to backend when available
    console.log("Submitting post", { postContent, postImage, promptText });
    handleCloseModal();
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
          {posts.map((post) => (
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
                      {post.likes.toLocaleString()}
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-500"
                    >
                      <MessageCircle className="w-5 h-5" />
                      {post.comments}
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
                      onClick={() => setPostImage(null)}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {!postImage && (
                  <div className="mt-4 flex gap-3">
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
                  </div>
                )}

                {postImage && (
                  <div className="mt-4">
                    <button
                      type="button"
                      className="flex items-center gap-2 text-sm text-purple-600"
                      onClick={() => setShowPrompt(!showPrompt)}
                    >
                      <Sparkles className="w-4 h-4" />{" "}
                      {showPrompt ? "Hide prompt" : "Add AI prompt"}
                    </button>
                    {showPrompt && (
                      <textarea
                        value={promptText}
                        onChange={(event) => setPromptText(event.target.value)}
                        placeholder="Describe the prompt you used..."
                        className="mt-3 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-mono text-gray-700"
                        rows={3}
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="px-5 py-4 border-t border-gray-200">
                <button
                  type="button"
                  className="w-full py-3 rounded-xl bg-black text-white font-semibold disabled:opacity-50"
                  onClick={handleSubmit}
                  disabled={!postContent && !postImage}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

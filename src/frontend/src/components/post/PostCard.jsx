import React, { useState } from "react";
import { Heart, MessageCircle, MoreHorizontal, Sparkles } from "lucide-react";

export default function PostCard({
  post,
  authorInfo,
  onLikePost,
  onNavigateAiTools,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const displayName = authorInfo?.name || post.user;
  const displayAvatar = authorInfo?.avatar || post.avatar;

  return (
    <article className="border-b border-gray-200 py-6">
      <div className="flex gap-3">
        <img
          src={displayAvatar}
          alt={`${displayName} avatar`}
          className="w-10 h-10 rounded-full shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm text-gray-900">
                {displayName}
              </p>
              <p className="text-xs text-gray-500">{post.time}</p>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                title="Options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {menuOpen && (
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
                alt={`Post by ${displayName}`}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </div>
          )}

          {post.hasPrompt && (
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <Sparkles className="w-4 h-4 text-purple-500" /> AI Prompt
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
              onClick={() => onLikePost?.(post.id)}
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
              onClick={onNavigateAiTools}
            >
              Use AI tools
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Sparkles,
  Crown,
} from "lucide-react";
import CommentSection from "./CommentSection";
import ImageLightbox from "../common/ImageLightbox";

export default function PostCard({
  post,
  authorInfo,
  onLikePost,
  onNavigateAiTools,
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const displayName = authorInfo?.name || post.user;
  const displayAvatar = authorInfo?.avatar || post.avatar;
  const backendPostId = post?.backendId || post?.id || post?._id;
  const authorUserId = post?.userId || post?.authorId;

  // Check premium status
  const isPremium = Boolean(
    authorInfo?.isPremium ||
      authorInfo?.premiumOneMonth ||
      authorInfo?.premiumSixMonths ||
      post?.isPremium ||
      post?.premiumOneMonth ||
      post?.premiumSixMonths
  );

  const handleViewProfile = () => {
    if (authorUserId) {
      navigate(`/user/${authorUserId}`);
    }
  };

  return (
    <article className="border-b border-gray-200 py-6">
      <div className="flex gap-3 items-start">
        <button
          type="button"
          onClick={handleViewProfile}
          className="shrink-0 focus:outline-none rounded-full relative group cursor-pointer"
          title={`View ${displayName}'s profile`}
        >
          {/* Premium Avatar Frame */}
          {isPremium && (
            <div
              className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-full animate-spin-slow opacity-75 group-hover:opacity-100 transition-opacity"
              style={{ animationDuration: "3s" }}
            />
          )}
          <div
            className={`relative ${
              isPremium
                ? "p-0.5 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-full"
                : ""
            }`}
          >
            <img
              src={displayAvatar}
              alt={`${displayName} avatar`}
              className={`w-10 h-10 rounded-full object-cover hover:opacity-90 transition-all cursor-pointer ${
                isPremium ? "ring-2 ring-white" : ""
              }`}
            />
          </div>
          {/* Premium Crown Badge */}
          {isPremium && (
            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-0.5 shadow-lg">
              <Crown className="w-3 h-3 text-white" />
            </div>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleViewProfile}
                  className={`font-semibold text-sm transition-colors focus:outline-none text-left cursor-pointer ${
                    isPremium
                      ? "bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 bg-clip-text text-transparent hover:from-yellow-400 hover:via-orange-400 hover:to-pink-400"
                      : "text-gray-900 hover:text-blue-600 hover:underline"
                  }`}
                >
                  {displayName}
                </button>
                {isPremium && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white shadow-sm">
                    <Crown className="w-2.5 h-2.5" />
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">{post.time}</p>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
                title="Options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-lg z-20">
                  <button className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 cursor-pointer">
                    Save
                  </button>
                  <button className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 cursor-pointer">
                    Hide
                  </button>
                  <button className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-gray-50 cursor-pointer">
                    Report
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-800 mt-3">{post.content}</p>

          {post.image && !post.video && (
            <div
              className="rounded-2xl overflow-hidden border border-gray-200 mt-4 cursor-pointer"
              onClick={() => setLightboxOpen(true)}
            >
              <img
                src={post.image}
                alt={`Post by ${displayName}`}
                className="w-full h-auto object-cover hover:opacity-95 transition-opacity"
                loading="lazy"
                title="Click to view full image"
              />
            </div>
          )}

          {post.video && (
            <div className="rounded-2xl overflow-hidden border border-gray-200 mt-4">
              <video
                src={post.video}
                controls
                className="w-full h-auto"
                preload="metadata"
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
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-500 cursor-pointer"
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
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-500 cursor-pointer"
              onClick={() => setShowComments((prev) => !prev)}
              aria-expanded={showComments}
              aria-label="View comments"
            >
              <MessageCircle className="w-5 h-5" />
              {Number(post.comments || 0).toLocaleString()}
            </button>
            <button
              type="button"
              className="text-sm text-purple-600 hover:text-purple-700 cursor-pointer"
              onClick={onNavigateAiTools}
            >
              Use AI tools
            </button>
          </div>
          {showComments && <CommentSection postId={backendPostId} />}
        </div>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        imageUrl={post.image}
        alt={`Post by ${displayName}`}
      />
    </article>
  );
}

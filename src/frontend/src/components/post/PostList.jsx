import React from "react";
import PostCard from "./PostCard";

export default function PostList({
  posts,
  userCache,
  onLikePost,
  onNavigateAiTools,
}) {
  if (!posts?.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <div
          key={post.id}
          className="animate-fade-in"
          style={{
            animationDelay: `${index * 50}ms`,
            animationFillMode: "both",
          }}
        >
          <PostCard
            post={post}
            authorInfo={post.userId ? userCache[post.userId] : null}
            onLikePost={onLikePost}
            onNavigateAiTools={onNavigateAiTools}
          />
        </div>
      ))}
    </div>
  );
}

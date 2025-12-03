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
    <>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          authorInfo={post.userId ? userCache[post.userId] : null}
          onLikePost={onLikePost}
          onNavigateAiTools={onNavigateAiTools}
        />
      ))}
    </>
  );
}

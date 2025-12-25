import React from "react";

const PostSkeleton = () => {
    return (
        <div className="border border-gray-200 rounded-2xl p-4 bg-white animate-pulse">
            {/* Header - Avatar + Name */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-20" />
                </div>
            </div>

            {/* Image placeholder */}
            <div className="w-full h-64 bg-gray-200 rounded-xl mb-4" />

            {/* Actions */}
            <div className="flex items-center gap-4">
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-16" />
            </div>
        </div>
    );
};

const PostListSkeleton = ({ count = 3 }) => {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, index) => (
                <PostSkeleton key={index} />
            ))}
        </div>
    );
};

export default PostListSkeleton;

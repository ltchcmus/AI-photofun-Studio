import React, { useEffect, useRef, useState } from "react";
import { Image, Video, Sparkles, X, Loader2 } from "lucide-react";

const DEFAULT_AVATAR = "https://placehold.co/40x40/111/fff?text=U";

export default function CreatePostWidget({
  currentUser,
  onCreatePost,
  onCreateVideoPost,
  onNavigateAiTools,
  autoOpen = false,
  initialImageUrl = null,
  initialPrompt = "",
  onClose = null,
  hideComposer = false,
}) {
  const [showModal, setShowModal] = useState(false);
  const [caption, setCaption] = useState("");
  const [prompt, setPrompt] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [postType, setPostType] = useState("image"); // "image" or "video"
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [imagePreview, videoPreview]);

  // Auto-open modal when autoOpen prop is true
  useEffect(() => {
    if (autoOpen) {
      setShowModal(true);
    }
  }, [autoOpen]);

  // Pre-fill data from AI tools
  useEffect(() => {
    if (initialImageUrl) {
      setImagePreview(initialImageUrl);
      setPostType("image");
    }
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialImageUrl, initialPrompt]);

  const resetForm = () => {
    setCaption("");
    setPrompt("");
    setImageFile(null);
    setVideoFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
    setError("");
    setPostType("image");
  };

  const handleOpen = () => {
    setShowModal(true);
    setError("");
  };

  const handleClose = () => {
    setShowModal(false);
    resetForm();
    if (onClose) {
      onClose();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    // Clear video if selecting image
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
      setVideoFile(null);
    }

    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    setImageFile(file);
    setPostType("image");
  };

  const handleVideoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      setError("Vui lòng chọn file video!");
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError("Video quá lớn! Vui lòng chọn video dưới 50MB.");
      return;
    }

    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    // Clear image if selecting video
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      setImageFile(null);
    }

    const preview = URL.createObjectURL(file);
    setVideoPreview(preview);
    setVideoFile(file);
    setPostType("video");
    setError("");
  };

  const handleSubmit = async () => {
    if (submitting) return;
    // Allow post with imagePreview URL (from AI tools) even without imageFile
    if (!caption && !imageFile && !videoFile && !imagePreview) {
      setError("Vui lòng nhập nội dung hoặc chọn ảnh/video.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      if (postType === "video" && videoFile) {
        // Create video post
        await onCreateVideoPost({ caption, prompt, video: videoFile });
      } else {
        // Create image post - pass imageUrl if no file (from AI tools)
        await onCreatePost({
          caption,
          prompt,
          image: imageFile,
          imageUrl: !imageFile && imagePreview ? imagePreview : undefined
        });
      }
      handleClose();
    } catch (submitError) {
      const message =
        submitError?.response?.data?.message ||
        submitError?.message ||
        "Không thể tạo bài viết";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = currentUser?.fullName || currentUser?.name || "You";

  return (
    <>
      {!hideComposer && (
        <div className="flex gap-3 items-center">
          <img
            src={currentUser?.avatar || DEFAULT_AVATAR}
            alt={`${displayName} avatar`}
            className="w-12 h-12 rounded-full bg-gray-200 shrink-0"
          />
          <button
            type="button"
            onClick={handleOpen}
            className="flex-1 text-left text-gray-500 border border-gray-200 rounded-full py-3 px-4 hover:bg-gray-50"
          >
            Share something inspiring...
          </button>
          <button
            type="button"
            className="p-2 -m-2 hover:bg-gray-100 rounded-full text-gray-500"
            onClick={handleOpen}
            title="Upload image"
          >
            <Image className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-2 -m-2 hover:bg-gray-100 rounded-full text-blue-500"
            onClick={handleOpen}
            title="Upload video"
          >
            <Video className="w-5 h-5" />
          </button>
        </div>
      )}

      {showModal && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={handleClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Create post</h2>
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded-full"
                  onClick={handleClose}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto">
                <textarea
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  placeholder="Share your artwork or process..."
                  className="w-full resize-none outline-none text-base text-gray-800 placeholder-gray-500"
                  rows={4}
                />

                {imagePreview && (
                  <div className="relative mt-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full rounded-xl border border-gray-200"
                    />
                    <button
                      type="button"
                      className="absolute top-3 right-3 p-1.5 bg-black/70 rounded-full text-white"
                      onClick={() => {
                        URL.revokeObjectURL(imagePreview);
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {videoPreview && (
                  <div className="relative mt-4">
                    <video
                      src={videoPreview}
                      controls
                      className="w-full rounded-xl border border-gray-200"
                    />
                    <button
                      type="button"
                      className="absolute top-3 right-3 p-1.5 bg-black/70 rounded-full text-white z-10"
                      onClick={() => {
                        URL.revokeObjectURL(videoPreview);
                        setVideoPreview(null);
                        setVideoFile(null);
                        setPostType("image");
                      }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-600"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Image className="w-4 h-4" />
                    Upload image
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 border border-blue-300 rounded-xl text-sm font-medium text-blue-600"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <Video className="w-4 h-4" />
                    Upload video
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 border border-purple-200 rounded-xl text-sm font-medium text-purple-600"
                    onClick={onNavigateAiTools}
                  >
                    Create with AI
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoChange}
                  />
                </div>

                <div className="mt-6">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    <Sparkles className="w-4 h-4 text-purple-500" /> Prompt đã
                    dùng (tuỳ chọn)
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Nhập prompt bạn đã dùng để tạo ảnh/video..."
                    className="mt-3 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-mono text-gray-700 focus:ring-2 focus:ring-purple-200"
                    rows={3}
                  />
                </div>

                {error && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-semibold text-gray-600 rounded-lg hover:bg-gray-100"
                  onClick={handleClose}
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="px-5 py-2 text-sm font-semibold text-white bg-black rounded-lg hover:bg-gray-900 disabled:opacity-50 flex items-center gap-2"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? "Đang đăng..." : postType === "video" ? "Đăng video" : "Đăng bài"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

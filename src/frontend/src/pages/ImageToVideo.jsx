import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Film, Image, Play, Share2, Upload } from "lucide-react";
import { communicationApi } from "../api/communicationApi";
import ShareToGroupModal from "../components/common/ShareToGroupModal";
import { toast } from "../hooks/use-toast";

// Models for Image to Video
const IMAGE_TO_VIDEO_MODELS = [
    { value: "wan2.6-i2v", label: "wan2.6-i2v (Mặc định)", description: "Chất lượng cao" },
    { value: "wan2.2-i2v-plus", label: "wan2.2-i2v-plus", description: "Phiên bản Plus" },
    { value: "wan2.5-i2v-preview", label: "wan2.5-i2v-preview", description: "Preview mới" },
    { value: "wan2.2-i2v-flash", label: "wan2.2-i2v-flash", description: "Nhanh hơn" },
    { value: "wan2.1-i2v-turbo", label: "wan2.1-i2v-turbo", description: "Turbo - nhanh nhất" },
    { value: "wan2.1-i2v-plus", label: "wan2.1-i2v-plus", description: "Phiên bản Plus cũ" },
];

const ImageToVideo = () => {
    const navigate = useNavigate();
    const uploadInputRef = useRef(null);
    const pollIntervalRef = useRef(null);

    const [imageUrl, setImageUrl] = useState("");
    const [uploadedPreview, setUploadedPreview] = useState(null);
    const [prompt, setPrompt] = useState("");
    const [model, setModel] = useState("wan2.6-i2v");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [taskStatus, setTaskStatus] = useState("");
    const [taskId, setTaskId] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [error, setError] = useState("");
    const [dragOver, setDragOver] = useState(false);

    // Handle file upload
    const handleFileUpload = async (file) => {
        if (!file) return;

        setUploading(true);
        setError("");

        try {
            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => setUploadedPreview(e.target.result);
            reader.readAsDataURL(file);

            // Upload file using communicationApi (same as chat/post upload)
            const result = await communicationApi.uploadChatImage(file);
            console.log("Upload result:", result);

            // Response is { code: 1000, result: { image: "..." } }
            const uploadedUrl = result?.result?.image || result?.url || result?.image;
            if (uploadedUrl) {
                setImageUrl(uploadedUrl);
                console.log("Image URL set:", uploadedUrl);
            } else {
                console.error("No URL found in response:", result);
                toast.error("Không thể upload ảnh. Vui lòng thử lại.");
            }
        } catch (err) {
            console.error("Upload error:", err);
            toast.error("Lỗi upload: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file) handleFileUpload(file);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setDragOver(false);
        const file = event.dataTransfer.files?.[0];
        if (file) handleFileUpload(file);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        setDragOver(false);
    };

    // Poll for task status
    const pollStatus = useCallback(async (id) => {
        const result = await pollVideoTaskStatus(
            id,
            "image-to-video",
            (status) => setTaskStatus(status || "Đang xử lý..."),
            1 // Only poll once, will be called again by interval
        );

        if (result.success) {
            setVideoUrl(result.videoUrl);
            setLoading(false);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        } else if (result.error && !result.error.includes("Timeout")) {
            toast.error(result.error);
            setLoading(false);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
    }, []);

    // Start video generation
    const handleGenerate = async () => {
        if (!imageUrl) {
            toast.warning("Vui lòng upload ảnh hoặc nhập URL ảnh.");
            return;
        }
        if (!prompt.trim()) {
            toast.warning("Vui lòng nhập mô tả chuyển động.");
            return;
        }

        setError("");
        setLoading(true);
        setVideoUrl(null);
        setTaskId(null);
        setTaskStatus("Đang khởi tạo...");

        const result = await generateVideoFromImage({
            imageUrl: imageUrl,
            prompt: prompt.trim(),
            model: model,
        });

        if (result.success && result.taskId) {
            setTaskId(result.taskId);
            setTaskStatus("Đang tạo video...");

            // Start polling
            pollIntervalRef.current = setInterval(() => {
                pollStatus(result.taskId);
            }, 3000);

            // Initial poll
            setTimeout(() => pollStatus(result.taskId), 1000);
        } else {
            toast.error(result.error || "Không thể tạo video. Vui lòng thử lại.");
            setLoading(false);
        }
    };

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, []);

    const handleDownload = async () => {
        if (!videoUrl) return;
        try {
            const response = await fetch(videoUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "ai-generated-video.mp4";
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            window.open(videoUrl, "_blank");
        }
    };

    const handleReset = () => {
        setImageUrl("");
        setUploadedPreview(null);
        setPrompt("");
        setVideoUrl(null);
        setTaskId(null);
        setTaskStatus("");
        setError("");
        if (uploadInputRef.current) uploadInputRef.current.value = "";
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };

    // Share video to feed
    const handleShare = () => {
        if (!videoUrl) return;
        // Navigate to dashboard with video URL and prompt pre-filled
        navigate("/dashboard", {
            state: {
                shareVideo: {
                    videoUrl: videoUrl,
                    prompt: prompt,
                }
            }
        });
    };

    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between gap-4 border border-gray-200 rounded-2xl px-4 py-3 bg-white shadow-sm">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-semibold"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
                    <Film className="w-5 h-5 text-purple-500" /> Image to Video
                </h1>
                <div className="text-xs text-gray-400">Beta</div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Input */}
                <section className="space-y-6">
                    {/* Image Upload */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold mb-4">Upload Ảnh Gốc</h2>

                        <div
                            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${dragOver
                                ? "border-purple-400 bg-purple-50"
                                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                                }`}
                            onClick={() => uploadInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                        >
                            {uploading ? (
                                <div className="py-4">
                                    <div className="w-8 h-8 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin mx-auto mb-2" />
                                    <p className="text-gray-600">Đang upload...</p>
                                </div>
                            ) : uploadedPreview ? (
                                <div className="relative">
                                    <img
                                        src={uploadedPreview}
                                        alt="Preview"
                                        className="max-h-48 mx-auto rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleReset();
                                        }}
                                        className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs"
                                    >
                                        Xóa
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                    <p className="text-gray-600 font-medium">Kéo thả ảnh vào đây</p>
                                    <p className="text-xs text-gray-500 mb-4">hoặc click để chọn file</p>
                                    <button
                                        type="button"
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold"
                                    >
                                        Chọn Ảnh
                                    </button>
                                </>
                            )}
                            <input
                                ref={uploadInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>

                        {/* Or URL input */}
                        <div className="mt-4">
                            <label className="block text-sm font-semibold mb-2">
                                Hoặc nhập URL ảnh
                            </label>
                            <input
                                type="text"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                            />
                        </div>
                    </div>

                    {/* Prompt & Model */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold mb-4">Mô Tả Chuyển Động</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Prompt</label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Mô tả cách bạn muốn ảnh chuyển động, ví dụ: Chủ thể đang cử động nhẹ nhàng, gió thổi qua tóc..."
                                    className="w-full border border-gray-300 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Model</label>
                                <select
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
                                >
                                    {IMAGE_TO_VIDEO_MODELS.map((m) => (
                                        <option key={m.value} value={m.value}>
                                            {m.label} - {m.description}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {!videoUrl && (
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={loading || !imageUrl}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg flex items-center justify-center gap-2 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {taskStatus || "Đang xử lý..."}
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5" /> Tạo Video
                                </>
                            )}
                        </button>
                    )}
                </section>

                {/* Right Column - Result */}
                <section className="space-y-6">
                    {loading && !videoUrl && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <div className="aspect-video rounded-2xl bg-gray-50 flex flex-col items-center justify-center">
                                <div className="w-16 h-16 border-4 border-gray-200 border-t-purple-500 rounded-full animate-spin mb-4" />
                                <p className="font-semibold text-gray-700">Đang tạo video...</p>
                                <p className="text-sm text-gray-500">{taskStatus}</p>
                                {taskId && (
                                    <p className="text-xs text-gray-400 mt-2">Task ID: {taskId}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {videoUrl && (
                        <>
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <h2 className="text-lg font-bold mb-4">Video Đã Tạo</h2>
                                <div className="aspect-video rounded-2xl bg-black overflow-hidden">
                                    <video
                                        controls
                                        autoPlay
                                        loop
                                        className="w-full h-full object-contain"
                                    >
                                        <source src={videoUrl} type="video/mp4" />
                                        Trình duyệt không hỗ trợ video.
                                    </video>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={handleDownload}
                                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-black text-white font-semibold hover:bg-gray-800"
                                    >
                                        <Download className="w-4 h-4" /> Tải Xuống
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleShare}
                                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-700 hover:to-pink-700"
                                    >
                                        <Share2 className="w-4 h-4" /> Chia Sẻ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-300 font-semibold hover:bg-gray-50"
                                    >
                                        Tạo Mới
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="font-bold mb-3">Chi Tiết</h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">Model: </span>
                                        <span className="font-medium">{model}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Prompt: </span>
                                        <span className="font-medium">{prompt}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {!loading && !videoUrl && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <div className="aspect-video border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center">
                                <div className="text-center p-8">
                                    <Film className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                    <p className="font-semibold text-gray-700 mb-1">Chưa có video</p>
                                    <p className="text-sm text-gray-500">
                                        Upload ảnh, nhập mô tả chuyển động và nhấn "Tạo Video"
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default ImageToVideo;

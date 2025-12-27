import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Film, Play, Share2, Video } from "lucide-react";
import { suggestPrompts, recordPromptChoice, generateVideoFromPrompt, pollVideoTaskStatus } from "../api/aiApi";
import { toast } from "../hooks/use-toast";

// Models for Prompt to Video (Text to Video)
const PROMPT_TO_VIDEO_MODELS = [
    { value: "wan2.6-t2v", label: "wan2.6-t2v (Mặc định)", description: "Chất lượng cao" },
    { value: "wan2.5-t2v-preview", label: "wan2.5-t2v-preview", description: "Preview mới" },
    { value: "wan2.2-t2v-plus", label: "wan2.2-t2v-plus", description: "Phiên bản Plus" },
    { value: "wan2.1-t2v-plus", label: "wan2.1-t2v-plus", description: "Phiên bản Plus cũ" },
    { value: "wan2.1-t2v-turbo", label: "wan2.1-t2v-turbo", description: "Turbo - nhanh nhất" },
];

const PromptToVideo = () => {
    const navigate = useNavigate();
    const pollIntervalRef = useRef(null);
    const suggestionTimeoutRef = useRef(null);
    const promptInputRef = useRef(null);

    const [prompt, setPrompt] = useState("");
    const [model, setModel] = useState("wan2.6-t2v");
    const [loading, setLoading] = useState(false);
    const [taskStatus, setTaskStatus] = useState("");
    const [taskId, setTaskId] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [error, setError] = useState("");

    // Prompt suggestions state
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    // Fetch suggestions
    const fetchSuggestions = useCallback(async (query) => {
        setLoadingSuggestions(true);
        try {
            const result = await suggestPrompts(query || "");
            if (result.success && result.suggestions.length > 0) {
                setSuggestions(result.suggestions);
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        } catch (err) {
            console.error('Error fetching suggestions:', err);
        } finally {
            setLoadingSuggestions(false);
        }
    }, []);

    const handlePromptChange = (event) => {
        const value = event.target.value;
        setPrompt(value);

        // Debounce suggestion fetch
        if (suggestionTimeoutRef.current) {
            clearTimeout(suggestionTimeoutRef.current);
        }
        suggestionTimeoutRef.current = setTimeout(() => {
            fetchSuggestions(value);
        }, 300);
    };

    const handlePromptFocus = () => {
        if (suggestions.length > 0) {
            setShowSuggestions(true);
        } else {
            fetchSuggestions(prompt);
        }
    };

    const handleSelectSuggestion = (suggestion) => {
        setPrompt(suggestion.text);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (promptInputRef.current && !promptInputRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Poll for task status
    const pollStatus = useCallback(async (id) => {
        const result = await pollVideoTaskStatus(
            id,
            "prompt-to-video",
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
        if (!prompt.trim()) {
            toast.warning("Vui lòng nhập mô tả video.");
            return;
        }

        setError("");
        setLoading(true);
        setVideoUrl(null);
        setTaskId(null);
        setTaskStatus("Đang khởi tạo...");
        setShowSuggestions(false);

        // Record prompt choice
        try {
            await recordPromptChoice(prompt.trim());
        } catch (err) {
            console.error('Failed to record prompt choice:', err);
        }

        const result = await generateVideoFromPrompt({
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
        setPrompt("");
        setVideoUrl(null);
        setTaskId(null);
        setTaskStatus("");
        setError("");
        setSuggestions([]);
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
                    <Video className="w-5 h-5 text-pink-500" /> Prompt to Video
                </h1>
                <div className="text-xs text-gray-400">Beta</div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Input */}
                <section className="space-y-6">
                    {/* Prompt */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold mb-4">Mô Tả Video</h2>

                        <div className="space-y-4">
                            <div className="relative" ref={promptInputRef}>
                                <label className="block text-sm font-semibold mb-2">Prompt</label>
                                <textarea
                                    value={prompt}
                                    onChange={handlePromptChange}
                                    onFocus={handlePromptFocus}
                                    placeholder="Mô tả video bạn muốn tạo, ví dụ: Một chú mèo đang chạy trên cánh đồng hoa với bầu trời xanh..."
                                    className="w-full border border-gray-300 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-pink-500 min-h-[150px] text-sm"
                                />

                                {/* Suggestions Dropdown */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                                        {loadingSuggestions && (
                                            <div className="px-4 py-2 text-sm text-gray-500">Đang tải gợi ý...</div>
                                        )}
                                        {suggestions.map((suggestion) => (
                                            <button
                                                key={suggestion.id}
                                                type="button"
                                                onClick={() => handleSelectSuggestion(suggestion)}
                                                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                            >
                                                <p className="text-sm text-gray-800">{suggestion.text}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Model</label>
                                <select
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm bg-white"
                                >
                                    {PROMPT_TO_VIDEO_MODELS.map((m) => (
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
                            disabled={loading || !prompt.trim()}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold text-lg flex items-center justify-center gap-2 hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                                <div className="w-16 h-16 border-4 border-gray-200 border-t-pink-500 rounded-full animate-spin mb-4" />
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
                                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold hover:from-pink-700 hover:to-purple-700"
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
                                    <Video className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                    <p className="font-semibold text-gray-700 mb-1">Chưa có video</p>
                                    <p className="text-sm text-gray-500">
                                        Nhập mô tả video và nhấn "Tạo Video"
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

export default PromptToVideo;
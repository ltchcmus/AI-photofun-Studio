import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    MessageCircle,
    Send,
    Paperclip,
    X,
    Loader2,
    Image as ImageIcon,
    Sparkles,
    RotateCcw,
    Download,
    Share2,
    Users,
    Upload,
} from "lucide-react";
import { useAuthContext } from "../context/AuthContext";
import ShareToGroupModal from "../components/common/ShareToGroupModal";
import CreatePostWidget from "../components/post/CreatePostWidget";
import { communicationApi } from "../api/communicationApi";
import { usePosts } from "../hooks/usePosts";
import { formatAIError } from "../utils/formatAIError";

const AI_BACKEND_URL = import.meta.env.VITE_AI_BACKEND_URL || "https://nmcnpm-api-ai.lethanhcong.site:46337/api/v1";

const AIChat = () => {
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const { currentUser, createPost } = usePosts();
    const messagesEndRef = useRef(null);
    const messageInputRef = useRef(null);
    const imageInputRef = useRef(null);

    // State
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [pendingMessages, setPendingMessages] = useState(new Set());
    const [error, setError] = useState(null);

    // Image attachment
    const [attachedImageUrl, setAttachedImageUrl] = useState(null);
    const [attachedImagePreview, setAttachedImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Reply to message
    const [replyToMessageId, setReplyToMessageId] = useState(null);
    const [replyToImageUrl, setReplyToImageUrl] = useState(null);

    // Share to group
    const [showShareToGroup, setShowShareToGroup] = useState(false);
    const [shareMediaUrl, setShareMediaUrl] = useState(null);

    // Share to feed
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareImageUrl, setShareImageUrl] = useState(null);

    // Lightbox
    const [lightboxImage, setLightboxImage] = useState(null);

    // Polling interval ref
    const pollingRef = useRef(null);

    // Scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Create session on mount
    useEffect(() => {
        createSession();
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    // Start polling when we have pending messages
    useEffect(() => {
        if (pendingMessages.size > 0 && sessionId) {
            startPolling();
        } else if (pollingRef.current) {
            clearInterval(pollingRef.current);
        }
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [pendingMessages.size, sessionId]);

    // Create session
    const createSession = async () => {
        try {
            const res = await fetch(`${AI_BACKEND_URL}/chat/sessions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: user?.id || "anonymous" }),
            });
            const data = await res.json();
            const newSessionId = data.result?.session_id || data.data?.session_id || data.session_id;

            if (newSessionId) {
                setSessionId(newSessionId);
                setMessages([
                    {
                        id: "welcome",
                        role: "bot",
                        content: `Xin chào! 👋 Tôi là AI Assistant, có thể giúp bạn:\n\n🎨 **Tạo ảnh** - "Tạo ảnh một con mèo dễ thương"\n🔍 **Upscale** - "Nâng độ phân giải ảnh này"\n🧹 **Xóa nền** - "Xóa nền ảnh này"\n🎭 **Reimagine** - "Biến ảnh thành tranh sơn dầu"\n☀️ **Relight** - "Thêm ánh sáng hoàng hôn"\n📐 **Expand** - "Mở rộng ảnh sang trái phải"\n🖌️ **Style Transfer** - "Áp dụng style này"\n\nHãy bắt đầu chat hoặc đính kèm ảnh để chỉnh sửa!`,
                        timestamp: new Date(),
                    },
                ]);
            } else {
                setError("Không thể tạo session. Vui lòng thử lại.");
            }
        } catch (err) {
            console.error("Create session error:", err);
            setError(`Lỗi kết nối: ${err.message}`);
        }
    };

    // Start polling for updates
    const startPolling = () => {
        if (pollingRef.current) clearInterval(pollingRef.current);

        pollingRef.current = setInterval(async () => {
            if (!sessionId || pendingMessages.size === 0) return;

            try {
                const res = await fetch(`${AI_BACKEND_URL}/chat/sessions/${sessionId}`);
                const data = await res.json();

                if (data.result?.messages) {
                    data.result.messages.forEach((msg) => {
                        if (pendingMessages.has(msg.message_id)) {
                            updateMessageFromAPI(msg);

                            if (msg.status === "COMPLETED" || msg.status === "FAILED") {
                                setPendingMessages((prev) => {
                                    const newSet = new Set(prev);
                                    newSet.delete(msg.message_id);
                                    return newSet;
                                });
                                setIsLoading(false);
                            }
                        }
                    });
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 2000);
    };

    // Update message from API response
    const updateMessageFromAPI = (apiMsg) => {
        const imageUrl = apiMsg.image_url || apiMsg.uploaded_urls?.[0];
        const intent = apiMsg.metadata?.intent;
        const extractedParams = apiMsg.metadata?.extracted_params;

        // Format content based on status
        let content = apiMsg.content || "Hoàn thành!";
        if (apiMsg.status === "FAILED") {
            // Use formatAIError to show friendly message instead of raw technical error
            content = formatAIError(apiMsg.content || apiMsg.error);
        }

        setMessages((prev) =>
            prev.map((m) =>
                m.id === apiMsg.message_id
                    ? {
                        ...m,
                        content,
                        imageUrl,
                        status: apiMsg.status,
                        intent,
                        extractedParams,
                    }
                    : m
            )
        );
    };

    // Send message
    const handleSendMessage = async () => {
        if (!sessionId) {
            setError("Chưa có session. Đang tạo lại...");
            await createSession();
            return;
        }

        const prompt = inputValue.trim();
        if (!prompt) return;

        setInputValue("");
        setIsLoading(true);
        setError(null);

        // Add user message to UI
        const userMsgId = `user-${Date.now()}`;
        setMessages((prev) => [
            ...prev,
            {
                id: userMsgId,
                role: "user",
                content: prompt,
                imageUrl: attachedImageUrl,
                timestamp: new Date(),
            },
        ]);

        // Build request
        const requestBody = {
            user_id: user?.id || "anonymous",
            prompt,
        };

        if (replyToMessageId) {
            requestBody.selected_messages = [replyToMessageId];
            cancelReply();
        }

        if (attachedImageUrl) {
            requestBody.image_url = attachedImageUrl;
            setAttachedImageUrl(null);
        }

        try {
            const res = await fetch(`${AI_BACKEND_URL}/chat/sessions/${sessionId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            const data = await res.json();
            const messageId = data.result?.message_id || data.data?.message_id;

            if (messageId) {
                // Add pending bot message
                setMessages((prev) => [
                    ...prev,
                    {
                        id: messageId,
                        role: "bot",
                        content: "⏳ Đang xử lý...",
                        status: "PENDING",
                        timestamp: new Date(),
                    },
                ]);
                setPendingMessages((prev) => new Set(prev).add(messageId));
            } else {
                setIsLoading(false);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `error-${Date.now()}`,
                        role: "bot",
                        content: "❌ Không thể gửi tin nhắn. Vui lòng thử lại.",
                        timestamp: new Date(),
                    },
                ]);
            }
        } catch (err) {
            console.error("Send message error:", err);
            setIsLoading(false);
            setMessages((prev) => [
                ...prev,
                {
                    id: `error-${Date.now()}`,
                    role: "bot",
                    content: `❌ Lỗi: ${err.message}`,
                    timestamp: new Date(),
                },
            ]);
        }
    };

    // Handle image file upload
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (event) => {
            setAttachedImagePreview(event.target.result);
        };
        reader.readAsDataURL(file);

        // Upload to get URL
        setIsUploading(true);
        try {
            const result = await communicationApi.uploadChatImage(file);
            const imageUrl = result?.result?.image || result?.result?.url || result?.url || result?.image;

            if (imageUrl) {
                setAttachedImageUrl(imageUrl);
            } else {
                setError("Không thể upload ảnh. Vui lòng thử lại.");
                setAttachedImagePreview(null);
            }
        } catch (err) {
            console.error("Upload error:", err);
            setError(`Lỗi upload: ${err.message}`);
            setAttachedImagePreview(null);
        } finally {
            setIsUploading(false);
            if (imageInputRef.current) imageInputRef.current.value = "";
        }
    };

    const removeAttachedImage = () => {
        setAttachedImageUrl(null);
        setAttachedImagePreview(null);
    };

    // Reply to message
    const handleReplyToImage = (messageId, imageUrl) => {
        setReplyToMessageId(messageId);
        setReplyToImageUrl(imageUrl);
        messageInputRef.current?.focus();
    };

    const cancelReply = () => {
        setReplyToMessageId(null);
        setReplyToImageUrl(null);
    };

    // Share handlers
    const handleShareToGroup = (imageUrl) => {
        setShareMediaUrl(imageUrl);
        setShowShareToGroup(true);
    };

    // Share to feed
    const handleShareToFeed = (imageUrl) => {
        setShareImageUrl(imageUrl);
        setShowShareModal(true);
    };

    // Download image
    const handleDownload = (imageUrl) => {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = `ai-generated-${Date.now()}.jpg`;
        link.click();
    };

    // Reset chat
    const handleResetChat = () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setMessages([]);
        setSessionId(null);
        setPendingMessages(new Set());
        setError(null);
        createSession();
    };

    // Key press handler
    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Format time
    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between gap-4 border border-gray-200 rounded-2xl px-4 py-3 bg-white shadow-sm">
                <button
                    type="button"
                    onClick={() => navigate("/ai-tools")}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-semibold"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-purple-500" /> AI Chat
                </h1>
                <button
                    onClick={handleResetChat}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"
                    title="Bắt đầu cuộc trò chuyện mới"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </header>

            {/* Chat Container */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Messages Area */}
                <div className="h-[500px] overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user"
                                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-md"
                                    : "bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100"
                                    }`}
                            >
                                {/* Message content */}
                                <div className="whitespace-pre-wrap text-sm">{msg.content}</div>

                                {/* Intent & Params */}
                                {msg.intent && (
                                    <div className="text-xs mt-2 opacity-70">
                                        🎯 Intent: {msg.intent}
                                    </div>
                                )}

                                {/* Image */}
                                {msg.imageUrl && (
                                    <div className="mt-3">
                                        <img
                                            src={msg.imageUrl}
                                            alt="AI Generated"
                                            className="rounded-xl max-w-[300px] max-h-[250px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => setLightboxImage(msg.imageUrl)}
                                        />
                                        {msg.role === "bot" && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <button
                                                    onClick={() => handleDownload(msg.imageUrl)}
                                                    className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg"
                                                >
                                                    <Download className="w-3 h-3" /> Download
                                                </button>
                                                <button
                                                    onClick={() => handleReplyToImage(msg.id, msg.imageUrl)}
                                                    className="flex items-center gap-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1.5 rounded-lg"
                                                >
                                                    <RotateCcw className="w-3 h-3" /> Chỉnh sửa
                                                </button>
                                                <button
                                                    onClick={() => handleShareToFeed(msg.imageUrl)}
                                                    className="flex items-center gap-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg"
                                                >
                                                    <Share2 className="w-3 h-3" /> Đăng Feed
                                                </button>
                                                <button
                                                    onClick={() => handleShareToGroup(msg.imageUrl)}
                                                    className="flex items-center gap-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg"
                                                >
                                                    <Users className="w-3 h-3" /> Gửi nhóm
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Status badge */}
                                {msg.status && msg.role === "bot" && (
                                    <div className="mt-2">
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full ${msg.status === "COMPLETED"
                                                ? "bg-green-100 text-green-700"
                                                : msg.status === "PROCESSING"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : msg.status === "FAILED"
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                }`}
                                        >
                                            {msg.status}
                                        </span>
                                    </div>
                                )}

                                {/* Timestamp */}
                                <div
                                    className={`text-xs mt-1 ${msg.role === "user" ? "text-purple-100" : "text-gray-400"
                                        }`}
                                >
                                    {formatTime(msg.timestamp)}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {isLoading && pendingMessages.size > 0 && (
                        <div className="flex justify-start">
                            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200 bg-white">
                    {/* Reply Preview */}
                    {replyToMessageId && replyToImageUrl && (
                        <div className="flex items-center gap-3 mb-3 p-2 bg-purple-50 border border-purple-200 rounded-xl">
                            <img src={replyToImageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                            <div className="flex-1">
                                <div className="text-xs text-purple-600 font-medium">↩️ Chỉnh sửa ảnh này</div>
                            </div>
                            <button onClick={cancelReply} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Hidden file input */}
                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                    />

                    {/* Attached Image Preview */}
                    {(attachedImagePreview || attachedImageUrl) && (
                        <div className="flex items-center gap-3 mb-3 p-2 bg-blue-50 border border-blue-200 rounded-xl">
                            <img src={attachedImagePreview || attachedImageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                            <div className="flex-1 overflow-hidden">
                                <div className="text-xs text-blue-600 font-medium flex items-center gap-2">
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-3 h-3 animate-spin" /> Đang upload...
                                        </>
                                    ) : (
                                        <>📎 Ảnh đã đính kèm</>
                                    )}
                                </div>
                                {attachedImageUrl && (
                                    <div className="text-xs text-green-600">✓ Upload thành công</div>
                                )}
                            </div>
                            <button onClick={removeAttachedImage} className="text-gray-400 hover:text-gray-600" disabled={isUploading}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Message Input */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => imageInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50"
                            title="Upload ảnh"
                        >
                            {isUploading ? (
                                <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
                            ) : (
                                <Upload className="w-5 h-5 text-gray-600" />
                            )}
                        </button>
                        <input
                            ref={messageInputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Nhập tin nhắn..."
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isLoading || !inputValue.trim()}
                            className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white text-4xl hover:opacity-70"
                        onClick={() => setLightboxImage(null)}
                    >
                        ×
                    </button>
                    <img
                        src={lightboxImage}
                        alt="Full size"
                        className="max-w-full max-h-full rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* Share to Group Modal */}
            <ShareToGroupModal
                isOpen={showShareToGroup}
                onClose={() => setShowShareToGroup(false)}
                mediaUrl={shareMediaUrl}
                isVideo={false}
                prompt="AI Generated Image"
            />

            {/* Share to Feed Modal */}
            {showShareModal && (
                <CreatePostWidget
                    currentUser={currentUser}
                    onCreatePost={createPost}
                    autoOpen={true}
                    hideComposer={true}
                    initialImageUrl={shareImageUrl}
                    initialPrompt="🤖 Created with AI Chat"
                    onClose={() => setShowShareModal(false)}
                />
            )}
        </div>
    );
};

export default AIChat;

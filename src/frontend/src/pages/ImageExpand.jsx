import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Download,
    Image as ImageIcon,
    Maximize2,
    Share2,
} from "lucide-react";
import { expandImage, pollTaskStatus } from "../api/aiApi";
import { communicationApi } from "../api/communicationApi";
import { usePosts } from "../hooks/usePosts";
import CreatePostWidget from "../components/post/CreatePostWidget";

const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

const ImageExpand = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const { createPost, currentUser } = usePosts();

    const [uploadedImage, setUploadedImage] = useState(null);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [prompt, setPrompt] = useState("Expand to show more beautiful scenery and landscape");
    const [left, setLeft] = useState(100);
    const [right, setRight] = useState(100);
    const [top, setTop] = useState(50);
    const [bottom, setBottom] = useState(50);
    const [processing, setProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState("");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [showShareModal, setShowShareModal] = useState(false);

    const canExpand = useMemo(
        () => !!uploadedImage && !processing,
        [uploadedImage, processing]
    );

    const handleFileSelect = async (files) => {
        if (!files || !files.length) return;
        try {
            const file = files[0];
            const dataUrl = await readFileAsDataUrl(file);
            setUploadedImage(dataUrl);
            setUploadedFile(file);
            setResult(null);
            setError("");
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch {
            setError("Không thể đọc ảnh, vui lòng thử lại.");
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setDragOver(false);
        handleFileSelect(event.dataTransfer.files);
    };

    const handleExpand = async () => {
        if (!canExpand) {
            setError("Hãy tải ảnh lên trước.");
            return;
        }

        setProcessing(true);
        setProcessingStatus("Đang chuẩn bị...");
        setResult(null);
        setError("");

        try {
            // Upload image
            setProcessingStatus("Đang upload ảnh...");
            let apiImageUrl;
            try {
                const uploadResult = await communicationApi.uploadChatImage(uploadedFile);
                apiImageUrl = uploadResult?.result?.image || uploadResult?.result?.url || uploadResult?.url || uploadResult?.image;
                if (!apiImageUrl) throw new Error("Không nhận được URL từ server");
            } catch (uploadErr) {
                setError("Không thể upload ảnh. Vui lòng thử lại.");
                setProcessing(false);
                return;
            }

            // Call expand API
            setProcessingStatus("Đang gửi yêu cầu expand...");
            const expandResult = await expandImage({
                imageUrl: apiImageUrl,
                prompt: prompt,
                left: left,
                right: right,
                top: top,
                bottom: bottom,
            });

            if (!expandResult.success) {
                throw new Error(expandResult.error || "Expand failed");
            }

            // Poll for completion
            setProcessingStatus("Đang xử lý AI...");
            const pollResult = await pollTaskStatus(
                expandResult.taskId,
                "v1/features/image-expand",
                (status, attempt) => {
                    setProcessingStatus(`Đang xử lý... (${attempt}/60)`);
                },
                60,
                3000
            );

            if (!pollResult.success) {
                throw new Error(pollResult.error || "Processing failed");
            }

            const resultImageUrl = pollResult.imageUrl || pollResult.data?.uploaded_urls?.[0];
            setResult({
                before: uploadedImage,
                after: resultImageUrl || uploadedImage,
            });
        } catch (err) {
            console.error("Expand error:", err);
            setError(`Lỗi: ${err.message}. Vui lòng thử lại.`);
        } finally {
            setProcessing(false);
            setProcessingStatus("");
        }
    };

    const handleDownload = () => {
        if (!result?.after) return;
        const link = document.createElement("a");
        link.href = result.after;
        link.download = "expanded-image.jpg";
        link.click();
    };

    const handleShare = () => {
        if (result?.after) {
            setShowShareModal(true);
        }
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
                    <Maximize2 className="w-5 h-5 text-blue-500" /> Image Expand
                </h1>
                <div className="text-xs text-gray-400">Beta</div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="space-y-6">
                    {/* Upload Section */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold mb-4">Upload Image</h2>
                        <div
                            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${dragOver ? "border-blue-300 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                                }`}
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                        >
                            <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p className="text-gray-600 font-medium">Kéo & thả ảnh vào đây</p>
                            <p className="text-xs text-gray-500 mb-4">hoặc click để chọn</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileSelect(e.target.files)}
                            />
                        </div>
                        {uploadedImage && (
                            <div className="mt-4">
                                <img src={uploadedImage} alt="Preview" className="w-full rounded-xl" />
                            </div>
                        )}
                    </div>

                    {/* Settings Section */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold mb-4">Expand Settings</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Prompt</label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl p-3 min-h-[80px]"
                                    placeholder="Mô tả nội dung vùng mở rộng..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Left (px)</label>
                                    <input
                                        type="number"
                                        value={left}
                                        onChange={(e) => setLeft(parseInt(e.target.value) || 0)}
                                        min="0"
                                        max="500"
                                        className="w-full border border-gray-300 rounded-xl p-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Right (px)</label>
                                    <input
                                        type="number"
                                        value={right}
                                        onChange={(e) => setRight(parseInt(e.target.value) || 0)}
                                        min="0"
                                        max="500"
                                        className="w-full border border-gray-300 rounded-xl p-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Top (px)</label>
                                    <input
                                        type="number"
                                        value={top}
                                        onChange={(e) => setTop(parseInt(e.target.value) || 0)}
                                        min="0"
                                        max="500"
                                        className="w-full border border-gray-300 rounded-xl p-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Bottom (px)</label>
                                    <input
                                        type="number"
                                        value={bottom}
                                        onChange={(e) => setBottom(parseInt(e.target.value) || 0)}
                                        min="0"
                                        max="500"
                                        className="w-full border border-gray-300 rounded-xl p-3"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{error}</p>
                    )}

                    <button
                        onClick={handleExpand}
                        disabled={!canExpand}
                        className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg flex items-center justify-center gap-2 hover:bg-blue-600 disabled:opacity-50"
                    >
                        <Maximize2 className="w-5 h-5" /> Expand Image
                    </button>
                </section>

                <section className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold mb-4">Result</h2>
                        {processing ? (
                            <div className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-gray-700 font-semibold">Đang xử lý...</p>
                                    <p className="text-sm text-gray-500">{processingStatus || "Vui lòng chờ..."}</p>
                                </div>
                            </div>
                        ) : result ? (
                            <>
                                <img src={result.after} alt="Result" className="w-full rounded-xl mb-4" />
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleDownload}
                                        className="py-3 rounded-xl bg-black text-white font-semibold flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-4 h-4" /> Download
                                    </button>
                                    <button
                                        onClick={handleShare}
                                        className="py-3 rounded-xl border border-gray-300 font-semibold flex items-center justify-center gap-2 hover:bg-gray-50"
                                    >
                                        <Share2 className="w-4 h-4" /> Share
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center">
                                <p className="text-gray-500 text-center px-4">Kết quả sẽ hiển thị ở đây</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Share to Post Modal */}
            {showShareModal && (
                <CreatePostWidget
                    currentUser={currentUser}
                    onCreatePost={createPost}
                    autoOpen={true}
                    hideComposer={true}
                    initialImageUrl={result?.after}
                    initialPrompt={`🔍 Image Expand\n\nExpanded: Left ${left}px, Right ${right}px, Top ${top}px, Bottom ${bottom}px`}
                    onClose={() => setShowShareModal(false)}
                />
            )}
        </div>
    );
};

export default ImageExpand;

import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Download,
    Image as ImageIcon,
    Share2,
    Sun,
    Users,
} from "lucide-react";
import { relightImage, pollTaskStatus } from "../api/aiApi";
import { communicationApi } from "../api/communicationApi";
import { usePosts } from "../hooks/usePosts";
import CreatePostWidget from "../components/post/CreatePostWidget";
import ShareToGroupModal from "../components/common/ShareToGroupModal";
import { toast } from "../hooks/use-toast";

const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

const Relight = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const { createPost, currentUser } = usePosts();

    const [uploadedImage, setUploadedImage] = useState(null);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [prompt, setPrompt] = useState("Warm sunset lighting, golden hour glow");
    const [style, setStyle] = useState("standard");
    const [processing, setProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState("");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [showShareModal, setShowShareModal] = useState(false);
    const [showShareToGroup, setShowShareToGroup] = useState(false);

    const canRelight = useMemo(
        () => !!uploadedImage && !!prompt.trim() && !processing,
        [uploadedImage, prompt, processing]
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
            toast.error("Unable to read image, please try again.");
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setDragOver(false);
        handleFileSelect(event.dataTransfer.files);
    };

    const handleRelight = async () => {
        if (!canRelight) {
            toast.warning("Please upload an image and enter a lighting description first.");
            return;
        }

        setProcessing(true);
        setProcessingStatus("Preparing...");
        setResult(null);
        setError("");

        try {
            // Upload image
            setProcessingStatus("Uploading image...");
            let apiImageUrl;
            try {
                const uploadResult = await communicationApi.uploadChatImage(uploadedFile);
                apiImageUrl = uploadResult?.result?.image || uploadResult?.result?.url || uploadResult?.url || uploadResult?.image;
                if (!apiImageUrl) throw new Error("No URL received from server");
            } catch (uploadErr) {
                toast.error("Unable to upload image. Please try again.");
                setProcessing(false);
                return;
            }

            // Call relight API
            setProcessingStatus("Sending relight request...");
            const relightResult = await relightImage({
                imageUrl: apiImageUrl,
                prompt: prompt,
                style: style,
            });

            if (!relightResult.success) {
                throw new Error(relightResult.error || "Relight failed");
            }

            // Poll for completion
            setProcessingStatus("Processing with AI...");
            const pollResult = await pollTaskStatus(
                relightResult.taskId,
                "v1/features/relight",
                (status, attempt) => {
                    setProcessingStatus(`Processing... (${attempt}/60)`);
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
            console.error("Relight error:", err);
            toast.error(`Error: ${err.message}. Please try again.`);
        } finally {
            setProcessing(false);
            setProcessingStatus("");
        }
    };

    const handleDownload = () => {
        if (!result?.after) return;
        const link = document.createElement("a");
        link.href = result.after;
        link.download = "relight-result.jpg";
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
                    <Sun className="w-5 h-5 text-orange-500" /> Relight
                </h1>

            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="space-y-6">
                    {/* Upload Section */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold mb-4">Upload Image</h2>
                        <div
                            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${dragOver ? "border-orange-300 bg-orange-50" : "border-gray-300 hover:border-gray-400"
                                }`}
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                        >
                            <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p className="text-gray-600 font-medium">Drag & drop your image here</p>
                            <p className="text-xs text-gray-500 mb-4">or click to browse</p>
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
                        <h2 className="text-lg font-bold mb-4">Lighting Settings</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Prompt</label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl p-3 min-h-[80px]"
                                    placeholder="Describe the lighting you want..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Style</label>
                                <select
                                    value={style}
                                    onChange={(e) => setStyle(e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl p-3"
                                >
                                    <option value="standard">Standard</option>
                                    <option value="dramatic">Dramatic</option>
                                    <option value="soft">Soft</option>
                                    <option value="natural">Natural</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleRelight}
                        disabled={!canRelight}
                        className="w-full py-4 rounded-2xl bg-orange-500 text-white font-semibold text-lg flex items-center justify-center gap-2 hover:bg-orange-600 disabled:opacity-50"
                    >
                        <Sun className="w-5 h-5" /> Apply Relight
                    </button>
                </section>

                <section className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold mb-4">Result</h2>
                        {processing ? (
                            <div className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-16 h-16 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-gray-700 font-semibold">Processing...</p>
                                    <p className="text-sm text-gray-500">{processingStatus || "Please wait..."}</p>
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
                                        className="py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold flex items-center justify-center gap-2"
                                    >
                                        <Share2 className="w-4 h-4" /> Post Feed
                                    </button>
                                    <button
                                        onClick={() => setShowShareToGroup(true)}
                                        className="py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold flex items-center justify-center gap-2 col-span-2"
                                    >
                                        <Users className="w-4 h-4" /> Send to Group
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center">
                                <p className="text-gray-500 text-center px-4">Result will appear here</p>
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
                    initialPrompt={`☀️ Relight: ${style}\n\nLighting: ${prompt}`}
                    onClose={() => setShowShareModal(false)}
                />
            )}

            {/* Share to Group Modal */}
            <ShareToGroupModal
                isOpen={showShareToGroup}
                onClose={() => setShowShareToGroup(false)}
                mediaUrl={result?.after}
                isVideo={false}
                prompt={`Relight: ${style} - ${prompt}`}
            />
        </div>
    );
};

export default Relight;

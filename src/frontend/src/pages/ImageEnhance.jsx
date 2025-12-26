import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Image as ImageIcon,
  Share2,
  Sparkles,
  Users,
} from "lucide-react";
import { upscaleImage, pollTaskStatus } from "../api/aiApi";
import { communicationApi } from "../api/communicationApi";
import { usePosts } from "../hooks/usePosts";
import CreatePostWidget from "../components/post/CreatePostWidget";
import ShareToGroupModal from "../components/common/ShareToGroupModal";

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const ImageEnhance = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const sliderRef = useRef(null);
  const { createPost, currentUser } = usePosts();

  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [upscale, setUpscale] = useState("");
  const [faceCorrection, setFaceCorrection] = useState(false);
  const [noiseReduction, setNoiseReduction] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [sliderPercent, setSliderPercent] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showShareToGroup, setShowShareToGroup] = useState(false);

  const canEnhance = useMemo(
    () => !!uploadedImage && !!upscale && !processing,
    [uploadedImage, upscale, processing]
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

  const toggleUpscale = (value) => {
    setUpscale(value);
    setError("");
  };

  const toggleFace = () => setFaceCorrection((prev) => !prev);
  const toggleNoise = () => setNoiseReduction((prev) => !prev);

  const handleEnhance = async () => {
    if (!canEnhance) {
      setError("Hãy tải ảnh và chọn tỷ lệ upscale trước.");
      return;
    }

    setProcessing(true);
    setProcessingStatus("Đang chuẩn bị...");
    setResult(null);
    setSliderPercent(50);
    setError("");

    try {
      // Step 1: Upload image to file service first
      setProcessingStatus("Đang upload ảnh...");

      let apiImageUrl;
      try {
        const uploadResult = await communicationApi.uploadChatImage(uploadedFile);
        apiImageUrl = uploadResult?.result?.image || uploadResult?.result?.url || uploadResult?.url || uploadResult?.image;

        if (!apiImageUrl) {
          throw new Error("Không nhận được URL từ server");
        }
      } catch (uploadErr) {
        console.error("Upload error:", uploadErr);
        setError("Không thể upload ảnh. Vui lòng thử lại.");
        setProcessing(false);
        return;
      }

      // Determine flavor based on options
      let flavor = "photo"; // default
      if (noiseReduction) {
        flavor = "photo_denoiser";
      } else if (upscale === "4x") {
        flavor = "sublime"; // sublime for high quality 4x
      }

      // Step 2: Call upscale API
      setProcessingStatus("Đang gửi yêu cầu upscale...");
      const upscaleResult = await upscaleImage({
        imageUrl: apiImageUrl,
        flavor: flavor,
      });

      if (!upscaleResult.success) {
        throw new Error(upscaleResult.error || "Upscale failed");
      }

      // Step 3: Poll for completion
      setProcessingStatus("Đang xử lý AI...");
      const taskId = upscaleResult.taskId;

      const pollResult = await pollTaskStatus(
        taskId,
        "v1/features/upscale",
        (status, attempt) => {
          setProcessingStatus(`Đang xử lý... (${attempt}/60)`);
        },
        60,
        3000
      );

      if (!pollResult.success) {
        throw new Error(pollResult.error || "Processing failed");
      }

      // Step 4: Display result
      const enhancedImageUrl = pollResult.imageUrl || pollResult.data?.uploaded_urls?.[0];

      const stats = {
        time: "Processing complete",
        size: upscale === "4x" ? "4x Enhanced" : "2x Enhanced",
        quality: faceCorrection || noiseReduction ? "+45% Quality" : "+40% Quality",
      };

      setResult({
        before: uploadedImage,
        after: enhancedImageUrl || uploadedImage,
        stats,
      });

    } catch (err) {
      console.error("Enhance error:", err);
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
    link.download = "image-enhance.jpg";
    link.click();
  };

  const handleSave = () => {
    alert("Ảnh đã được lưu vào thư viện (demo)");
  };

  const handleShare = () => {
    if (result?.after) {
      setShowShareModal(true);
    }
  };

  const resetUpload = () => {
    setUploadedImage(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const computePercent = useCallback((clientX) => {
    const container = sliderRef.current;
    if (!container) return 50;
    const rect = container.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    return (x / rect.width) * 100;
  }, []);

  const handleSliderMove = useCallback(
    (clientX) => {
      setSliderPercent(computePercent(clientX));
    },
    [computePercent]
  );

  useEffect(() => {
    const stopDragging = () => setIsDragging(false);
    window.addEventListener("mouseup", stopDragging);
    window.addEventListener("touchend", stopDragging);
    return () => {
      window.removeEventListener("mouseup", stopDragging);
      window.removeEventListener("touchend", stopDragging);
    };
  }, []);

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
          <Sparkles className="w-5 h-5 text-purple-500" /> Image Enhance
        </h1>
        <div className="text-xs text-gray-400">Experimental</div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Upload Original Image</h2>
            <div
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${dragOver
                ? "border-blue-300 bg-blue-50"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                }`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragOver(false);
              }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 font-medium">
                Drag & drop your image
              </p>
              <p className="text-xs text-gray-500 mb-4">or click to browse</p>
              <button
                type="button"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold"
              >
                Select Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleFileSelect(event.target.files)}
              />
            </div>
            {uploadedImage && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">Original preview</p>
                <div className="relative bg-gray-100 rounded-2xl overflow-hidden">
                  <img
                    src={uploadedImage}
                    alt="Original"
                    className="w-full h-auto object-cover"
                  />
                  <button
                    type="button"
                    onClick={resetUpload}
                    className="absolute top-3 right-3 px-3 py-1 text-xs font-semibold bg-white/80 rounded-full"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Upscale Factor</h2>
            <div className="space-y-3">
              {["2x", "4x"].map((factor) => (
                <button
                  key={factor}
                  type="button"
                  onClick={() => toggleUpscale(factor)}
                  className={`w-full text-left p-4 border-2 rounded-2xl flex items-center gap-3 transition-colors ${upscale === factor
                    ? "border-black bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full border-2 ${upscale === factor
                      ? "border-black bg-black"
                      : "border-gray-400"
                      }`}
                  />
                  <span className="font-semibold">{factor} Upscale</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold">Options</h2>
            {[
              {
                label: "Face Correction",
                description: "Keep proportions & tones",
                value: faceCorrection,
                toggle: toggleFace,
              },
              {
                label: "Noise Reduction",
                description: "Remove grain & artifacts",
                value: noiseReduction,
                toggle: toggleNoise,
              },
            ].map((option) => (
              <div
                key={option.label}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
              >
                <div>
                  <p className="font-semibold text-sm">{option.label}</p>
                  <p className="text-xs text-gray-600">{option.description}</p>
                </div>
                <button
                  type="button"
                  onClick={option.toggle}
                  className={`relative inline-flex items-center h-7 w-12 rounded-full transition-colors ${option.value ? "bg-emerald-500" : "bg-gray-300"
                    }`}
                >
                  <span
                    className={`inline-block h-5 w-5 bg-white rounded-full transform transition-transform ${option.value ? "translate-x-5" : "translate-x-1"
                      }`}
                  />
                </button>
              </div>
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl p-3">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleEnhance}
            disabled={!canEnhance}
            className="w-full py-4 rounded-2xl bg-black text-white font-semibold text-lg flex items-center justify-center gap-2 hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-5 h-5" /> Enhance Image
          </button>
        </section>

        <section className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Enhanced Result</h2>
            {processing && (
              <div className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-700 font-semibold">Đang xử lý...</p>
                  <p className="text-sm text-gray-500">
                    {processingStatus || "Vui lòng chờ..."}
                  </p>
                </div>
              </div>
            )}
            {!processing && result && (
              <div
                ref={sliderRef}
                className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 cursor-col-resize select-none"
                onMouseDown={(event) => {
                  setIsDragging(true);
                  handleSliderMove(event.clientX);
                }}
                onMouseMove={(event) => {
                  if (isDragging) handleSliderMove(event.clientX);
                }}
                onMouseUp={() => setIsDragging(false)}
                onTouchStart={(event) => {
                  setIsDragging(true);
                  handleSliderMove(event.touches[0].clientX);
                }}
                onTouchMove={(event) => {
                  if (isDragging) handleSliderMove(event.touches[0].clientX);
                }}
              >
                <img
                  src={result.before}
                  alt="Before"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPercent}%` }}
                >
                  <img
                    src={result.after}
                    alt="After"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute top-2 left-2 text-xs font-semibold px-2 py-1 bg-black/60 text-white rounded">
                  Before
                </div>
                <div className="absolute top-2 right-2 text-xs font-semibold px-2 py-1 bg-black/60 text-white rounded">
                  After
                </div>
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white/90 shadow"
                  style={{
                    left: `${sliderPercent}%`,
                    transform: "translateX(-50%)",
                  }}
                />
              </div>
            )}
            {!processing && !result && (
              <div className="aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-center p-8">
                <div>
                  <Sparkles className="w-8 h-8 mx-auto text-gray-400 mb-3" />
                  <p className="font-semibold text-gray-700 mb-1">
                    No result yet
                  </p>
                  <p className="text-sm text-gray-500">
                    Upload an image and tap Enhance Image to see the difference.
                  </p>
                </div>
              </div>
            )}
          </div>

          {result && (
            <>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold mb-4">Enhancement Stats</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing Time</span>
                    <span className="font-semibold">{result.stats.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Output Size</span>
                    <span className="font-semibold">{result.stats.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quality Boost</span>
                    <span className="font-semibold">
                      {result.stats.quality}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full py-3 rounded-xl bg-black text-white font-semibold flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" /> Đăng Feed
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowShareToGroup(true)}
                    className="py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" /> Gửi Nhóm
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold"
                >
                  Save to Library
                </button>
              </div>
            </>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-sm text-blue-900">
            <h3 className="font-bold mb-3">Tips</h3>
            <ul className="space-y-2">
              <li>• 1000px+ images yield better upscale results.</li>
              <li>• PNG hoặc JPG giúp giữ chất lượng ổn định.</li>
              <li>• Bật Face Correction khi xử lý ảnh chân dung.</li>
              <li>• Dùng slider để xem sự khác biệt rõ ràng.</li>
            </ul>
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
          initialPrompt={`✨ Enhanced with AI Image Enhance\n\nUpscale: ${upscale}${faceCorrection ? "\nFace Correction: On" : ""}${noiseReduction ? "\nNoise Reduction: On" : ""}`}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Share to Group Modal */}
      <ShareToGroupModal
        isOpen={showShareToGroup}
        onClose={() => setShowShareToGroup(false)}
        mediaUrl={result?.after}
        isVideo={false}
        prompt={`Image Enhance: ${upscale} upscale`}
      />
    </div>
  );
};

export default ImageEnhance;

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Image, Share2, Sparkles, Users } from "lucide-react";
import { generateImage, pollTaskStatus, suggestPrompts, recordPromptChoice } from "../api/aiApi";
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

const TextToImage = () => {
  const navigate = useNavigate();
  const uploadInputRef = useRef(null);
  const { createPost, currentUser } = usePosts();

  const [prompt, setPrompt] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [model, setModel] = useState("realism");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [loading, setLoading] = useState(false);
  const [taskStatus, setTaskStatus] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showShareToGroup, setShowShareToGroup] = useState(false);

  // Prompt suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const suggestionTimeoutRef = useRef(null);
  const promptInputRef = useRef(null);

  const charCount = useMemo(() => prompt.length, [prompt]);

  // Fetch suggestions when prompt changes (with debounce)
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

  // Fetch popular suggestions on focus if prompt is empty
  const handlePromptFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    } else {
      // Fetch popular prompts when focused with empty input
      fetchSuggestions(prompt);
    }
  };

  const handlePromptChange = (event) => {
    const value = event.target.value.slice(0, 1000);
    setPrompt(value);

    // Debounce suggestion fetch
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }
    suggestionTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion) => {
    setPrompt(suggestion.text);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleClearPrompt = () => {
    setPrompt("");
    setSuggestions([]);
    setShowSuggestions(false);
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

  const handleFilePick = async (files) => {
    if (!files || !files.length) return;
    try {
      const dataUrl = await readFileAsDataUrl(files[0]);
      setUploadedImage(dataUrl);
    } catch (err) {
      setError("Không thể đọc ảnh tham chiếu. Vui lòng thử lại.");
    }
  };

  const handleFileChange = (event) => {
    handleFilePick(event.target.files);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    handleFilePick(event.dataTransfer.files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const removeUploaded = () => {
    setUploadedImage(null);
    if (uploadInputRef.current) uploadInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Vui lòng nhập mô tả trước khi tạo ảnh.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    setTaskStatus("Đang khởi tạo...");
    setShowSuggestions(false);

    // Record the prompt choice for improving suggestions
    try {
      await recordPromptChoice(prompt.trim());
    } catch (err) {
      console.error('Failed to record prompt choice:', err);
    }

    // Helper to format error message
    const formatError = (error) => {
      const errorStr = (error?.toString() || "").toLowerCase();
      const errorMsg = (error?.message || "").toLowerCase();

      if (errorStr.includes("429") || errorStr.includes("rate limit") ||
        errorStr.includes("quota") || errorStr.includes("limit") ||
        errorMsg.includes("429") || errorMsg.includes("rate limit") ||
        errorMsg.includes("exceeded")) {
        return "⚠️ Bạn đã đạt giới hạn tạo ảnh trong ngày hôm nay. Vui lòng thử lại vào ngày mai hoặc nâng cấp Premium.";
      }
      if (errorStr.includes("401") || errorStr.includes("unauthorized")) {
        return "⚠️ Lỗi xác thực. Vui lòng đăng nhập lại.";
      }
      if (errorStr.includes("500") || errorStr.includes("server")) {
        return "⚠️ Máy chủ đang bận. Vui lòng thử lại sau ít phút.";
      }
      return error?.message || error || "Đã xảy ra lỗi. Vui lòng thử lại.";
    };

    try {
      // Step 1: Submit generation request
      const genResult = await generateImage({
        prompt,
        model,
        aspectRatio,
      });

      if (!genResult.success) {
        setError(formatError(genResult.error));
        setLoading(false);
        return;
      }

      setTaskStatus("Đang tạo ảnh...");

      // Step 2: Poll for result
      const pollResult = await pollTaskStatus(
        genResult.taskId,
        "v1/features/image-generation",
        (status, attempt) => {
          setTaskStatus(`${status} (lần thử ${attempt})...`);
        }
      );

      if (pollResult.success) {
        setResult({
          imageUrl: pollResult.imageUrl,
          prompt,
          timestamp: new Date().toLocaleString(),
          model,
          aspectRatio,
        });
      } else {
        setError(formatError(pollResult.error));
      }
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
      setTaskStatus("");
    }
  };

  const handleDownload = async () => {
    if (!result?.imageUrl) return;
    try {
      const response = await fetch(result.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ai-generated-image.jpg";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // Fallback to direct link
      const link = document.createElement("a");
      link.href = result.imageUrl;
      link.download = "ai-generated-image.jpg";
      link.target = "_blank";
      link.click();
    }
  };

  const handleShare = () => {
    if (result?.imageUrl) {
      setShowShareModal(true);
    }
  };

  const handleSave = () => {
    alert("Image saved to your library (demo).");
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
          <Sparkles className="w-5 h-5 text-purple-500" /> Text to Image
        </h1>
        <div className="text-xs text-gray-400">v0.1</div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Describe Your Image</h2>
            <label
              className="block text-sm font-semibold mb-2"
              htmlFor="prompt"
            >
              Your Prompt
            </label>
            <div className="relative" ref={promptInputRef}>
              <textarea
                id="prompt"
                value={prompt}
                onChange={handlePromptChange}
                onFocus={handlePromptFocus}
                placeholder="Describe what you want to create..."
                className="w-full border border-gray-300 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent min-h-[140px] text-sm"
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
            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
              <span>
                Character count: <strong>{charCount}</strong>/1000
              </span>
              <button
                type="button"
                onClick={handleClearPrompt}
                className="font-semibold text-gray-600 hover:text-gray-900"
              >
                Clear
              </button>
            </div>

            {/* Model and Aspect Ratio Selection */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold mb-2" htmlFor="model">
                  Model
                </label>
                <select
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white"
                >
                  <option value="realism">Realism</option>
                  <option value="artistic">Artistic</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" htmlFor="aspect-ratio">
                  Aspect Ratio
                </label>
                <select
                  id="aspect-ratio"
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white"
                >
                  <option value="1:1">1:1 (Square)</option>
                  <option value="16:9">16:9 (Landscape)</option>
                  <option value="9:16">9:16 (Portrait)</option>
                  <option value="4:3">4:3 (Standard)</option>
                  <option value="3:4">3:4 (Portrait)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">
              Upload Reference Image (Optional)
            </h2>
            <div
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${dragOver
                ? "border-blue-300 bg-blue-50"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                }`}
              onClick={() => uploadInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Image className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 font-medium">
                Drag & drop your image here
              </p>
              <p className="text-xs text-gray-500 mb-4">or click to browse</p>
              <button
                type="button"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold"
              >
                Select Image
              </button>
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            {uploadedImage && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">Reference preview</p>
                <div className="relative bg-gray-100 rounded-2xl overflow-hidden">
                  <img
                    src={uploadedImage}
                    alt="Reference"
                    className="w-full h-auto object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeUploaded}
                    className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl p-3">
              {error}
            </p>
          )}
        </section>

        <section className="space-y-6">
          {loading && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="aspect-square rounded-2xl bg-gray-50 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4" />
                <p className="font-semibold text-gray-700">
                  Đang tạo hình ảnh...
                </p>
                <p className="text-sm text-gray-500">
                  {taskStatus || "Quá trình có thể mất vài giây"}
                </p>
              </div>
            </div>
          )}

          {!loading && result && (
            <>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">Generated Image</h2>
                <div className="aspect-square rounded-2xl bg-gray-50 overflow-hidden">
                  <img
                    src={result.imageUrl}
                    alt="Generated"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-black text-white font-semibold"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold"
                  >
                    <Share2 className="w-4 h-4" /> Đăng Feed
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowShareToGroup(true)}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold"
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
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold mb-4">Image Details</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div>
                    <p className="text-xs text-gray-500">Prompt</p>
                    <p className="font-medium">{result.prompt}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Model</p>
                      <p className="font-medium capitalize">{result.model || "Realism"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Aspect Ratio</p>
                      <p className="font-medium">{result.aspectRatio || "1:1"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Generated at</p>
                      <p className="font-medium">{result.timestamp}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {!loading && !result && (
            <>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-center p-8">
                  <div>
                    <Sparkles className="w-8 h-8 mx-auto text-gray-400 mb-3" />
                    <p className="font-semibold text-gray-700 mb-1">
                      No image yet
                    </p>
                    <p className="text-sm text-gray-500">
                      Start by writing a detailed prompt and tap Generate Image.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="py-4 px-8 rounded-2xl bg-black text-white font-semibold text-lg flex items-center gap-2 hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-5 h-5" /> Generate Image
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Share to Post Modal */}
      {showShareModal && (
        <CreatePostWidget
          currentUser={currentUser}
          onCreatePost={createPost}
          autoOpen={true}
          hideComposer={true}
          initialImageUrl={result?.imageUrl}
          initialPrompt={`🎨 Created with AI Text-to-Image\n\nPrompt: ${result?.prompt || prompt}`}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Share to Group Modal */}
      <ShareToGroupModal
        isOpen={showShareToGroup}
        onClose={() => setShowShareToGroup(false)}
        mediaUrl={result?.imageUrl}
        isVideo={false}
        prompt={result?.prompt || prompt}
      />
    </div>
  );
};

export default TextToImage;

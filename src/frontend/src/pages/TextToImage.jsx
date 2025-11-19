import React, { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Image, Share2, Sparkles } from "lucide-react";

const quickPrompts = [
  {
    id: "city",
    label: "🏙️ Futuristic City",
    text: "A futuristic city at sunset",
  },
  {
    id: "cyberpunk",
    label: "👤 Cyberpunk Portrait",
    text: "Portrait in cyberpunk style",
  },
  {
    id: "mountain",
    label: "🏔️ Mountain Landscape",
    text: "Mountain landscape with crystal lake",
  },
  {
    id: "geometric",
    label: "🎨 Geometric Art",
    text: "Abstract geometric patterns",
  },
  { id: "robot", label: "🤖 Anime Robot", text: "Cute robot in anime style" },
  {
    id: "temple",
    label: "🏯 Ancient Temple",
    text: "Ancient temple hidden in lush forest",
  },
];

const stylePresets = [
  {
    id: "realistic",
    label: "Realistic",
    thumbnail:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=300&fit=crop",
  },
  {
    id: "anime",
    label: "Anime",
    thumbnail:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&h=300&fit=crop",
  },
  {
    id: "oil",
    label: "Oil Painting",
    thumbnail:
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=300&h=300&fit=crop",
  },
  {
    id: "digital",
    label: "Digital Art",
    thumbnail:
      "https://images.unsplash.com/photo-1618556450991-2f1af64e8191?w=300&h=300&fit=crop",
  },
  {
    id: "render",
    label: "3D Render",
    thumbnail:
      "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300&h=300&fit=crop",
  },
  {
    id: "sketch",
    label: "Sketch",
    thumbnail:
      "https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=300&h=300&fit=crop",
  },
];

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

  const [prompt, setPrompt] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const charCount = useMemo(() => prompt.length, [prompt]);

  const handlePromptChange = (event) => {
    setPrompt(event.target.value.slice(0, 1000));
  };

  const handleQuickPrompt = (text) => {
    setPrompt(text);
  };

  const handleClearPrompt = () => {
    setPrompt("");
  };

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

  const placeholderUrl = (seed) =>
    `https://images.unsplash.com/photo-${seed}?w=1024&h=1024&fit=crop`;

  const handleGenerate = () => {
    if (!prompt.trim()) {
      setError("Vui lòng nhập mô tả trước khi tạo ảnh.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    setTimeout(() => {
      const seed = Math.floor(Math.random() * 999999999999);
      setResult({
        imageUrl: placeholderUrl(seed),
        prompt,
        timestamp: new Date().toLocaleString(),
        style: selectedStyle,
      });
      setLoading(false);
    }, 1800);
  };

  const handleDownload = () => {
    if (!result?.imageUrl) return;
    const link = document.createElement("a");
    link.href = result.imageUrl;
    link.download = "text-to-image.jpg";
    link.click();
  };

  const handleShare = () => {
    alert("Share feature will be available soon.");
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
            <textarea
              id="prompt"
              value={prompt}
              onChange={handlePromptChange}
              placeholder="Describe what you want to create..."
              className="w-full border border-gray-300 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent min-h-[140px] text-sm"
            />
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
            <div className="mt-6">
              <p className="text-sm font-semibold mb-3">Quick Prompts</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickPrompts.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleQuickPrompt(preset.text)}
                    className="text-left px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">
              Upload Reference Image (Optional)
            </h2>
            <div
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                dragOver
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

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Style Presets</h2>
            <div className="grid grid-cols-3 gap-3">
              {stylePresets.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSelectedStyle(style.id)}
                  className={`relative overflow-hidden rounded-2xl border-2 h-24 transition-colors ${
                    selectedStyle === style.id
                      ? "border-black"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <img
                    src={style.thumbnail}
                    alt={style.label}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-semibold">
                      {style.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-black text-white font-semibold text-lg flex items-center justify-center gap-2 hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-5 h-5" /> Generate Image
          </button>
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
                  Quá trình có thể mất vài giây
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
                <div className="grid grid-cols-2 gap-3 mb-4">
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
                    className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-300 font-semibold"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold"
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
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Style</p>
                      <p className="font-medium">{result.style || "Custom"}</p>
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
          )}
        </section>
      </div>
    </div>
  );
};

export default TextToImage;

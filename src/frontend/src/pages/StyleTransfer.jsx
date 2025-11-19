import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Image as ImageIcon,
  Sparkles,
  Wand2,
} from "lucide-react";

const stylePresets = [
  {
    id: "oil",
    title: "Oil Painting",
    subtitle: "Rich textures & brush strokes",
    thumbnail: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=300&h=300&fit=crop",
  },
  {
    id: "watercolor",
    title: "Watercolor",
    subtitle: "Soft gradients & bleed",
    thumbnail: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&h=300&fit=crop",
  },
  {
    id: "cartoon",
    title: "Cartoon",
    subtitle: "Bold outlines, vibrant colors",
    thumbnail: "https://images.unsplash.com/photo-1503602642458-232111445657?w=300&h=300&fit=crop",
  },
  {
    id: "sketch",
    title: "Sketch",
    subtitle: "Graphite pencil look",
    thumbnail: "https://images.unsplash.com/photo-1472289065668-ce650ac443d2?w=300&h=300&fit=crop",
  },
  {
    id: "cyberpunk",
    title: "Cyberpunk",
    subtitle: "Neon lights & glow",
    thumbnail: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=300&h=300&fit=crop",
  },
  {
    id: "3d",
    title: "3D Render",
    subtitle: "Plastic lighting finish",
    thumbnail: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=300&h=300&fit=crop",
  },
  {
    id: "abstract",
    title: "Abstract",
    subtitle: "Bold shapes & colors",
    thumbnail: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=300&h=300&fit=crop",
  },
];

const randomResultUrl = () =>
  `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1e15)}?w=900&h=900&fit=crop`;

const StyleTransfer = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [uploadedImage, setUploadedImage] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [strength, setStrength] = useState(60);
  const [resolution, setResolution] = useState("1080");
  const [detailLevel, setDetailLevel] = useState("high");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const canTransfer = useMemo(
    () => !!uploadedImage && !!selectedStyle && !processing,
    [uploadedImage, selectedStyle, processing]
  );

  const readFile = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileSelection = async (files) => {
    if (!files || !files.length) return;
    const [file] = files;
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn đúng định dạng ảnh.");
      return;
    }
    try {
      const dataUrl = await readFile(file);
      setUploadedImage(dataUrl);
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
    handleFileSelection(event.dataTransfer.files);
  };

  const removeUpload = () => {
    setUploadedImage(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTransfer = () => {
    if (!canTransfer) {
      setError("Tải ảnh và chọn style trước khi áp dụng.");
      return;
    }
    setProcessing(true);
    setError("");
    setResult(null);

    setTimeout(() => {
      setProcessing(false);
      setResult({
        styled: randomResultUrl(),
        original: uploadedImage,
        style: selectedStyle,
        strength,
        resolution,
        detailLevel,
        timestamp: new Date().toLocaleString(),
      });
    }, 2200);
  };

  const handleDownload = () => {
    if (!result?.styled) return;
    const link = document.createElement("a");
    link.href = result.styled;
    link.download = "style-transfer.jpg";
    link.click();
  };

  const handleShare = () => {
    alert("Tính năng chia sẻ sẽ có sau.");
  };

  const handleSave = () => {
    alert("Ảnh đã được lưu (demo)");
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
          <Sparkles className="w-5 h-5 text-purple-500" /> Style Transfer
        </h1>
        <div className="text-xs text-gray-400">Beta</div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Upload Original Image</h2>
            <div
              className={`border-2 border-dashed rounded-2xl p-6 h-64 flex items-center justify-center text-center cursor-pointer transition-colors ${
                dragOver ? "border-blue-300 bg-blue-50" : "border-gray-300 hover:border-gray-400"
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
              {uploadedImage ? (
                <img src={uploadedImage} alt="Original" className="w-full h-full object-contain" />
              ) : (
                <div className="space-y-3">
                  <ImageIcon className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-600">Drag & drop hoặc chọn ảnh từ máy</p>
                  <button type="button" className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold">
                    Select Image
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleFileSelection(event.target.files)}
              />
            </div>
            {uploadedImage && (
              <button
                type="button"
                onClick={removeUpload}
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-red-500"
              >
                Remove
              </button>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Style Strength</h2>
            <div className="flex items-center justify-between mb-2 text-sm font-semibold">
              <span>Intensity</span>
              <span>{strength}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={strength}
              onChange={(event) => setStrength(Number(event.target.value))}
              className="w-full accent-black"
            />
            <p className="text-xs text-gray-500 mt-2">
              Độ mạnh càng cao thì phong cách mới càng nổi bật.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <button
              type="button"
              onClick={() => setAdvancedOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="text-lg font-bold">Advanced Settings</span>
              <Wand2 className={`w-5 h-5 transition-transform ${advancedOpen ? "rotate-45" : "rotate-0"}`} />
            </button>
            {advancedOpen && (
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <label className="font-semibold">Resolution</label>
                  <select
                    value={resolution}
                    onChange={(event) => setResolution(event.target.value)}
                    className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="720">720p (faster)</option>
                    <option value="1080">1080p (balanced)</option>
                    <option value="4k">4K (slow)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold">Detail Level</label>
                  <select
                    value={detailLevel}
                    onChange={(event) => setDetailLevel(event.target.value)}
                    className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="standard">Standard</option>
                    <option value="high">High</option>
                    <option value="ultra">Ultra</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl p-3">{error}</p>
          )}

          <button
            type="button"
            onClick={handleTransfer}
            disabled={!canTransfer}
            className="w-full py-4 rounded-2xl bg-black text-white font-semibold text-lg flex items-center justify-center gap-2 hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-5 h-5" /> Apply Style Transfer
          </button>
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-bold mb-2">Select Art Style</h2>
          <div className="space-y-3">
            {stylePresets.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setSelectedStyle(style.id)}
                className={`w-full relative overflow-hidden rounded-2xl border-2 h-24 text-left transition-all ${
                  selectedStyle === style.id ? "border-black shadow-[0_0_0_2px_white,0_0_0_4px_black]" : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <img src={style.thumbnail} alt={style.title} className="absolute inset-0 w-full h-full object-cover" />
                <div className="relative h-full w-full bg-black/40 flex flex-col items-start justify-center px-4 text-white">
                  <p className="font-semibold">{style.title}</p>
                  <p className="text-xs text-white/80">{style.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Result Preview</h2>
            {processing ? (
              <div className="aspect-square bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4" />
                <p className="font-semibold text-gray-700">Đang chuyển đổi phong cách...</p>
                <p className="text-sm text-gray-500">Vui lòng chờ trong giây lát</p>
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden">
                  <img src={result.styled} alt="Result" className="w-full h-full object-cover" />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Style</p>
                    <p className="font-semibold capitalize">{result.style}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Strength</p>
                    <p className="font-semibold">{result.strength}%</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Resolution</p>
                    <p className="font-semibold">{result.resolution}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Detail</p>
                    <p className="font-semibold capitalize">{result.detailLevel}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Original</p>
                    <div className="aspect-[4/3] bg-gray-50 rounded-xl overflow-hidden">
                      {result.original && (
                        <img src={result.original} alt="Original" className="w-full h-full object-cover" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Styled</p>
                    <div className="aspect-[4/3] bg-gray-50 rounded-xl overflow-hidden">
                      <img src={result.styled} alt="Styled" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="w-full py-3 rounded-xl bg-black text-white font-semibold flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Image
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleShare}
                      className="py-3 rounded-xl border border-gray-200 font-semibold"
                    >
                      Share
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="py-3 rounded-xl bg-blue-600 text-white font-semibold"
                    >
                      Save
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    className="w-full py-3 rounded-xl border-2 border-gray-200 font-semibold text-gray-700"
                  >
                    Try another style
                  </button>
                </div>
              </div>
            ) : (
              <div className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-center p-6">
                <div>
                  <Sparkles className="w-8 h-8 mx-auto text-gray-400 mb-3" />
                  <p className="font-semibold text-gray-700 mb-1">No preview yet</p>
                  <p className="text-sm text-gray-500">
                    Tải ảnh + chọn style rồi nhấn Apply để xem kết quả.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StyleTransfer;

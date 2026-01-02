import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Image as ImageIcon,
  Sparkles,
  Trash2,
} from "lucide-react";

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const PhotoRestore = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [imageData, setImageData] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [colorize, setColorize] = useState(false);
  const [scratchRemoval, setScratchRemoval] = useState(false);
  const [faceCorrection, setFaceCorrection] = useState(false);

  const canRestore = useMemo(
    () => !!imageData && !processing,
    [imageData, processing]
  );

  const handleFilePick = async (files) => {
    if (!files || !files.length) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image format.");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setImageData(dataUrl);
      setResultData(null);
      setError("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setError("Unable to read image, please try again.");
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    handleFilePick(event.dataTransfer.files);
  };

  const clearUpload = () => {
    setImageData(null);
    setResultData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRestore = () => {
    if (!canRestore) {
      setError("Please upload an image to restore first.");
      return;
    }
    setProcessing(true);
    setResultData(null);
    setError("");

    const filters = [];
    if (colorize) filters.push("sepia(0.2)");
    if (scratchRemoval) filters.push("contrast(1.06)");
    if (faceCorrection) filters.push("brightness(1.05)");

    setTimeout(() => {
      setResultData({
        src: imageData,
        filter: filters.join(" ") || "none",
      });
      setProcessing(false);
    }, 1500);
  };

  const handleDownload = () => {
    if (!resultData) return;
    const link = document.createElement("a");
    link.href = resultData.src;
    link.download = "photo-restore.png";
    link.click();
  };

  const optionCards = [
    {
      id: "colorize",
      label: "Colorize",
      description: "Convert black & white to color",
      value: colorize,
      action: () => setColorize((prev) => !prev),
    },
    {
      id: "scratch",
      label: "Scratch Removal",
      description: "Remove scratches and noise",
      value: scratchRemoval,
      action: () => setScratchRemoval((prev) => !prev),
    },
    {
      id: "face",
      label: "Face Correction",
      description: "Auto face enhancement",
      value: faceCorrection,
      action: () => setFaceCorrection((prev) => !prev),
    },
  ];

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
          <Sparkles className="w-5 h-5 text-purple-500" /> Photo Restore
        </h1>
        <div className="text-xs text-gray-400">v0.1</div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <p className="text-sm font-semibold mb-3">Upload Original Image</p>
            <div
              className={`relative h-64 border-2 border-dashed rounded-2xl flex items-center justify-center text-center p-4 cursor-pointer transition-colors ${dragOver
                  ? "border-blue-300 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
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
              {!imageData && (
                <div className="flex flex-col items-center gap-3">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                  <p className="text-gray-600 text-sm">
                    Drag & drop or select an image
                  </p>
                  <button
                    type="button"
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold"
                  >
                    Choose file
                  </button>
                </div>
              )}
              {imageData && (
                <img
                  src={imageData}
                  alt="Original"
                  className="absolute inset-0 w-full h-full object-contain p-4"
                />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleFilePick(event.target.files)}
              />
            </div>
            {imageData && (
              <button
                type="button"
                onClick={clearUpload}
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-red-500"
              >
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-3">
            <p className="text-sm font-semibold">Options</p>
            {optionCards.map((card) => (
              <div
                key={card.id}
                className="flex items-center justify-between border border-gray-200 rounded-2xl p-3 bg-gray-50"
              >
                <div>
                  <p className="text-sm font-semibold">{card.label}</p>
                  <p className="text-xs text-gray-500">{card.description}</p>
                </div>
                <button
                  type="button"
                  onClick={card.action}
                  className={`relative inline-flex items-center h-7 w-12 rounded-full transition-colors ${card.value ? "bg-emerald-500" : "bg-gray-300"
                    }`}
                >
                  <span
                    className={`inline-block h-5 w-5 bg-white rounded-full transform transition-transform ${card.value ? "translate-x-5" : "translate-x-1"
                      }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <p className="text-sm font-semibold mb-3">Result</p>
            <div className="relative h-64 rounded-2xl border border-gray-200 flex items-center justify-center overflow-hidden">
              {processing && (
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 border-2 border-gray-200 border-t-black rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-semibold">Restoring...</p>
                  <p className="text-xs text-gray-500">
                    This process may take a few seconds
                  </p>
                </div>
              )}
              {!processing && resultData && (
                <img
                  src={resultData.src}
                  alt="Result"
                  className="w-full h-full object-contain"
                  style={{
                    filter:
                      resultData.filter === "none"
                        ? undefined
                        : resultData.filter,
                  }}
                />
              )}
              {!processing && !resultData && (
                <div className="text-center text-gray-500 text-sm px-4">
                  Upload an image and click Restore Photo to see the result.
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleRestore}
              disabled={!canRestore}
              className="flex-1 py-3 rounded-xl bg-black text-white font-semibold text-sm hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Restore Photo
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!resultData || processing}
              className="py-3 px-4 rounded-xl border border-gray-200 font-semibold text-sm disabled:opacity-40"
            >
              <Download className="w-4 h-4 inline mr-1" /> Download
            </button>
          </div>
          <p className="text-xs text-gray-500">
            This demo simulates restoration in the browser. Integrate with backend
            for actual results.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PhotoRestore;

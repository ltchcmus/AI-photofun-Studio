import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Image, Sparkles, Trash2 } from "lucide-react";

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const FaceSwap = () => {
  const navigate = useNavigate();
  const origInputRef = useRef(null);
  const faceInputRef = useRef(null);

  const [origPreview, setOrigPreview] = useState(null);
  const [facePreview, setFacePreview] = useState(null);
  const [dragState, setDragState] = useState({ orig: false, face: false });
  const [faceCorrection, setFaceCorrection] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resultData, setResultData] = useState(null);

  const canSwap = useMemo(
    () => !!origPreview && !!facePreview && !processing,
    [origPreview, facePreview, processing]
  );

  const handleDrag = (type, isOver) => {
    setDragState((prev) => ({ ...prev, [type]: isOver }));
  };

  const handleFileSelection = async (files, type) => {
    if (!files || !files.length) return;
    try {
      const dataUrl = await readFileAsDataUrl(files[0]);
      if (type === "orig") {
        setOrigPreview(dataUrl);
        if (origInputRef.current) origInputRef.current.value = "";
      } else {
        setFacePreview(dataUrl);
        if (faceInputRef.current) faceInputRef.current.value = "";
      }
    } catch (err) {
      // surface a toast system later; for now use alert to keep UX simple
      alert("Không thể đọc ảnh, vui lòng thử lại.");
    }
  };

  const onDrop = (event, type) => {
    event.preventDefault();
    handleDrag(type, false);
    handleFileSelection(event.dataTransfer.files, type);
  };

  const removeFile = (type) => {
    if (type === "orig") {
      setOrigPreview(null);
      if (origInputRef.current) origInputRef.current.value = "";
    } else {
      setFacePreview(null);
      if (faceInputRef.current) faceInputRef.current.value = "";
    }
  };

  const toggleFaceCorrection = () => {
    setFaceCorrection((prev) => !prev);
  };

  const handleSwap = () => {
    if (!canSwap) return;
    setProcessing(true);
    setResultData(null);
    setTimeout(() => {
      setResultData(origPreview || facePreview);
      setProcessing(false);
    }, 2200);
  };

  const handleDownload = () => {
    if (!resultData) return;
    const link = document.createElement("a");
    link.href = resultData;
    link.download = "face-swap-result.jpg";
    link.click();
  };

  const handleSave = () => {
    alert("Đã lưu vào thư viện (demo)");
  };

  const dropClass = (type) =>
    `border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
      dragState[type]
        ? "border-blue-300 bg-blue-50"
        : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
    }`;

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
          <Sparkles className="w-5 h-5 text-purple-500" /> Face Swap
        </h1>
        <div className="text-xs text-gray-400">Beta</div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Upload Original Image</h2>
          <div
            className={dropClass("orig")}
            onClick={() => origInputRef.current?.click()}
            onDrop={(event) => onDrop(event, "orig")}
            onDragOver={(event) => {
              event.preventDefault();
              handleDrag("orig", true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              handleDrag("orig", false);
            }}
          >
            <Image className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 font-medium">
              Drag & drop original image
            </p>
            <p className="text-xs text-gray-500 mb-4">or click to browse</p>
            <button
              type="button"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold"
            >
              Select Original
            </button>
            <input
              ref={origInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) =>
                handleFileSelection(event.target.files, "orig")
              }
            />
          </div>
          {origPreview && (
            <div className="mt-4">
              <p className="text-sm font-semibold mb-2">Original preview</p>
              <div className="relative bg-gray-100 rounded-xl overflow-hidden">
                <img
                  src={origPreview}
                  alt="Original"
                  className="w-full h-auto object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile("orig")}
                  className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold mb-4">Upload Target Face</h2>
            <div
              className={dropClass("face")}
              onClick={() => faceInputRef.current?.click()}
              onDrop={(event) => onDrop(event, "face")}
              onDragOver={(event) => {
                event.preventDefault();
                handleDrag("face", true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                handleDrag("face", false);
              }}
            >
              <Image className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 font-medium">
                Drag & drop face image
              </p>
              <p className="text-xs text-gray-500 mb-4">or click to browse</p>
              <button
                type="button"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold"
              >
                Select Face
              </button>
              <input
                ref={faceInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) =>
                  handleFileSelection(event.target.files, "face")
                }
              />
            </div>
            {facePreview && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">Face preview</p>
                <div className="relative bg-gray-100 rounded-xl overflow-hidden w-48">
                  <img
                    src={facePreview}
                    alt="Face"
                    className="w-full h-auto object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile("face")}
                    className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-semibold text-sm">Face Correction</p>
              <p className="text-xs text-gray-600">
                Adjust alignment and tones
              </p>
            </div>
            <button
              type="button"
              onClick={toggleFaceCorrection}
              className={`relative inline-flex items-center h-7 w-12 rounded-full transition-colors ${
                faceCorrection ? "bg-emerald-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 bg-white rounded-full transform transition-transform ${
                  faceCorrection ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold mb-4">Result</h2>
          {processing ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-700 font-semibold">Swapping faces...</p>
                <p className="text-sm text-gray-500">
                  Vui lòng chờ trong giây lát
                </p>
              </div>
            </div>
          ) : resultData ? (
            <>
              <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
                <img
                  src={resultData}
                  alt="Result"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="py-3 rounded-xl border border-gray-300 font-semibold text-sm hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 inline mr-1" /> Download
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-sm text-gray-500">
                <Image className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                Upload images to enable swapping
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleSwap}
            disabled={!canSwap}
            className="mt-6 w-full py-3 rounded-xl bg-black text-white font-semibold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Swap Faces
          </button>
        </section>
      </div>
    </div>
  );
};

export default FaceSwap;

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Image,
  Save,
  Share2,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { removeBackground } from "../api/aiApi";
import { communicationApi } from "../api/communicationApi";
import { usePosts } from "../hooks/usePosts";
import CreatePostWidget from "../components/post/CreatePostWidget";
import LoadingScreen from "../components/common/LoadingScreen";
import ShareToGroupModal from "../components/common/ShareToGroupModal";

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const createCanvas = (width, height) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas.getContext("2d");
};

const compositeWithColor = (foregroundSrc, color) =>
  new Promise((resolve) => {
    const fg = new window.Image();
    fg.crossOrigin = "anonymous";
    fg.src = foregroundSrc;
    fg.onload = () => {
      const ctx = createCanvas(fg.width, fg.height);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, fg.width, fg.height);
      ctx.drawImage(fg, 0, 0, fg.width, fg.height);
      resolve(ctx.canvas.toDataURL("image/jpeg", 0.9));
    };
    fg.onerror = () => resolve(foregroundSrc);
  });

const compositeWithImage = (foregroundSrc, backgroundSrc) =>
  new Promise((resolve) => {
    const fg = new window.Image();
    const bg = new window.Image();
    fg.crossOrigin = bg.crossOrigin = "anonymous";
    let loaded = 0;
    const finish = () => {
      loaded += 1;
      if (loaded < 2) return;
      const width = Math.max(fg.width || 1, bg.width || 1);
      const height = Math.max(fg.height || 1, bg.height || 1);
      const ctx = createCanvas(width, height);
      ctx.drawImage(bg, 0, 0, width, height);
      ctx.drawImage(fg, 0, 0, width, height);
      resolve(ctx.canvas.toDataURL("image/jpeg", 0.9));
    };
    fg.onload = finish;
    bg.onload = finish;
    fg.onerror = finish;
    bg.onerror = finish;
    fg.src = foregroundSrc;
    bg.src = backgroundSrc;
  });

// Convert data URL to File object
const dataUrlToFile = (dataUrl, filename = "image.png") => {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

const BackgroundTools = () => {
  const navigate = useNavigate();
  const origInputRef = useRef(null);
  const bgInputRef = useRef(null);
  const origFileRef = useRef(null); // Store the original file for upload
  const { createPost, currentUser, loading: postsLoading } = usePosts();

  const [option, setOption] = useState(null); // remove | color | image
  const [color, setColor] = useState("#ffffff");
  const [origData, setOrigData] = useState(null);
  const [bgData, setBgData] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [error, setError] = useState("");
  // Store the removed background image for compositing
  const [removedBgData, setRemovedBgData] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showShareToGroup, setShowShareToGroup] = useState(false);

  const handleFileSelection = useCallback(async (files, type) => {
    if (!files || !files.length) return;
    try {
      const dataUrl = await readFileAsDataUrl(files[0]);
      if (type === "orig") {
        setOrigData(dataUrl);
        setResultData(null);
        setRemovedBgData(null);
        origFileRef.current = files[0]; // Store the file
      } else {
        setBgData(dataUrl);
      }
    } catch (err) {
      setError("Unable to read selected file, please try again.");
    }
  }, []);

  const onDrop = useCallback(
    (event, type) => {
      event.preventDefault();
      event.stopPropagation();
      const { files } = event.dataTransfer;
      handleFileSelection(files, type);
    },
    [handleFileSelection]
  );

  const optionRequiresBg = option === "image";
  const canApply = useMemo(() => {
    if (!option || processing) return false;
    if (!origData) return false;
    if (optionRequiresBg && !bgData) return false;
    return true;
  }, [origData, option, processing, optionRequiresBg, bgData]);

  const handleApply = async () => {
    if (!canApply) return;
    setProcessing(true);
    setError("");
    setProcessingStatus("Preparing...");

    try {
      // Step 1: Upload image to get a public URL
      setProcessingStatus("Uploading image...");

      let apiImageUrl;
      const fileToUpload = origFileRef.current || dataUrlToFile(origData, "image.png");

      try {
        const uploadResult = await communicationApi.uploadChatImage(fileToUpload);
        // Response format: { result: { image: "..." } } or { result: { url: "..." } }
        apiImageUrl = uploadResult?.result?.image || uploadResult?.result?.url || uploadResult?.url || uploadResult?.image;

        if (!apiImageUrl) {
          console.error("Upload response:", uploadResult);
          throw new Error("No URL received from server");
        }
      } catch (uploadErr) {
        console.error("Upload error:", uploadErr);
        setError("Unable to upload image. Please try again later.");
        setProcessing(false);
        return;
      }

      // Step 2: Call the remove background API
      setProcessingStatus("Removing background...");

      // Call the remove background API
      const result = await removeBackground(apiImageUrl);

      if (!result.success) {
        setError(result.error || "Unable to remove background. Please try again.");
        setProcessing(false);
        return;
      }

      const removedBgUrl = result.imageUrl;
      setRemovedBgData(removedBgUrl);

      if (option === "remove") {
        // Just show the removed background result
        setResultData(removedBgUrl);
      } else if (option === "color") {
        // Composite with color background
        setProcessingStatus("Applying color background...");
        const data = await compositeWithColor(removedBgUrl, color);
        setResultData(data);
      } else if (option === "image" && bgData) {
        // Composite with image background
        setProcessingStatus("Compositing with image background...");
        const data = await compositeWithImage(removedBgUrl, bgData);
        setResultData(data);
      }
    } catch (err) {
      setError("Error applying changes, please try again.");
    } finally {
      setProcessing(false);
      setProcessingStatus("");
    }
  };

  const handleDownload = () => {
    if (!resultData) return;
    const link = document.createElement("a");
    link.href = resultData;
    link.download = "background-tools.jpg";
    link.click();
  };

  const resetFile = (type) => {
    if (type === "orig") {
      setOrigData(null);
      setResultData(null);
      setRemovedBgData(null);
      origFileRef.current = null;
      if (origInputRef.current) origInputRef.current.value = "";
    } else {
      setBgData(null);
      if (bgInputRef.current) bgInputRef.current.value = "";
    }
  };

  const handleShare = () => {
    if (resultData) {
      setShowShareModal(true);
    }
  };

  const getOptionLabel = () => {
    if (option === "remove") return "Background Removed";
    if (option === "color") return `Background: ${color}`;
    if (option === "image") return "Custom Background";
    return "";
  };

  const optionCards = [
    {
      id: "remove",
      title: "Remove Background",
      subtitle: "Keep subject, remove background",
    },
    {
      id: "color",
      title: "Replace with Color",
      subtitle: "Choose a new background color",
    },
    {
      id: "image",
      title: "Replace with Image",
      subtitle: "Upload a different background image",
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
          <Sparkles className="w-5 h-5 text-purple-500" /> Background Tools
        </h1>

      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Upload Original Image</h2>
            <div
              onDrop={(event) => onDrop(event, "orig")}
              onDragOver={(event) => event.preventDefault()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${origData
                ? "border-blue-200 bg-blue-50"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                }`}
              onClick={() => origInputRef.current?.click()}
            >
              <Image className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 font-medium mb-2">
                Drag & drop image here
              </p>
              <p className="text-xs text-gray-500 mb-4">
                or choose from your computer
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold"
              >
                Browse files
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

            {origData && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">Preview</p>
                <div className="relative bg-gray-100 rounded-xl overflow-hidden">
                  <img
                    src={origData}
                    alt="Original"
                    className="w-full h-auto object-contain"
                  />
                  <button
                    type="button"
                    className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white"
                    onClick={() => resetFile("orig")}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Options</h2>
            <div className="space-y-3">
              {optionCards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setOption(card.id)}
                  className={`w-full text-left p-4 border-2 rounded-2xl transition-colors ${option === card.id
                    ? "border-black bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <p className="font-semibold">{card.title}</p>
                  <p className="text-xs text-gray-600">{card.subtitle}</p>
                </button>
              ))}

              {option === "color" && (
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    className="w-16 h-10 border rounded-lg"
                  />
                  <span className="text-sm text-gray-600">Choose background color</span>
                </div>
              )}

              {option === "image" && (
                <div className="mt-3">
                  <div
                    onDrop={(event) => onDrop(event, "bg")}
                    onDragOver={(event) => event.preventDefault()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${bgData
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    onClick={() => bgInputRef.current?.click()}
                  >
                    <p className="text-sm text-gray-600 mb-2">
                      Upload background image
                    </p>
                    <button
                      type="button"
                      className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium"
                    >
                      Select background
                    </button>
                    <input
                      ref={bgInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        handleFileSelection(event.target.files, "bg")
                      }
                    />
                  </div>

                  {bgData && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold mb-2">
                        Background preview
                      </p>
                      <div className="relative bg-gray-100 rounded-xl overflow-hidden">
                        <img
                          src={bgData}
                          alt="Background"
                          className="w-full h-auto object-contain"
                        />
                        <button
                          type="button"
                          className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white"
                          onClick={() => resetFile("bg")}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold mb-4">Result</h2>
          <div className="relative aspect-[4/3] rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden">
            {processing ? (
              <div className="text-center space-y-2">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto" />
                <p className="text-gray-600 font-medium">Processing...</p>
                <p className="text-xs text-gray-500">
                  {processingStatus || "Please wait a moment"}
                </p>
              </div>
            ) : resultData ? (
              <img
                src={resultData}
                alt="Result"
                className="w-full h-full object-cover"
              />
            ) : (
              <p className="text-gray-500 text-center px-4">
                Result will appear here after applying
              </p>
            )}
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleApply}
            disabled={!canApply}
            className="mt-6 w-full py-3 rounded-xl font-semibold text-white bg-black hover:bg-gray-900 disabled:opacity-50 disabled:pointer-events-none"
          >
            Apply Changes
          </button>

          {resultData && !processing && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 py-2 bg-black text-white rounded-xl text-sm font-semibold"
              >
                <Download className="w-4 h-4" /> Download
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-semibold"
              >
                <Share2 className="w-4 h-4" /> Post Feed
              </button>
              <button
                type="button"
                onClick={() => setShowShareToGroup(true)}
                className="flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl text-sm font-semibold"
              >
                <Users className="w-4 h-4" /> Send to Group
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold"
                onClick={() => alert("Saved to library (demo)")}
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          )}

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-900">
            <p className="font-semibold">Tips</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>High contrast subjects help remove background more accurately</li>
              <li>Color background option processes fastest</li>
              <li>Image background option may take longer</li>
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
          initialImageUrl={resultData}
          initialPrompt={`🖼️ Edited with AI Background Tools\n\n${getOptionLabel()}`}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Share to Group Modal */}
      <ShareToGroupModal
        isOpen={showShareToGroup}
        onClose={() => setShowShareToGroup(false)}
        mediaUrl={resultData}
        isVideo={false}
        prompt={`Background Tools: ${getOptionLabel()}`}
      />
    </div>
  );
};

export default BackgroundTools;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  Wand2,
  Zap,
  Image as ImageIcon,
  Sun,
  Maximize2,
  Film,
  Video,
  MessageCircle,
} from "lucide-react";

const CreateWithAI = () => {
  const [currentView, setCurrentView] = useState("tool-selection");
  const [selectedTool, setSelectedTool] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const navigate = useNavigate();

  // Listen for dark mode changes
  useEffect(() => {
    const checkDarkMode = () => {
      const darkModeStorage = localStorage.getItem("darkMode") === "true";
      const bodyHasDark = document.body.classList.contains("dark");
      setIsDarkMode(darkModeStorage || bodyHasDark);
    };

    checkDarkMode();
    window.addEventListener("storage", checkDarkMode);
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      window.removeEventListener("storage", checkDarkMode);
      observer.disconnect();
    };
  }, []);

  const featuredTools = [
    {
      id: "ai-chat",
      icon: <MessageCircle className="w-8 h-8" />,
      title: "AI Chat Assistant",
      description: "Your intelligent companion for creating and editing images",
      color: "purple",
    },
    {
      id: "generate",
      icon: <Sparkles className="w-8 h-8" />,
      title: "Text to Image",
      description: "Create stunning visuals from your imagination",
      color: "blue",
    },
    {
      id: "image-to-video",
      icon: <Film className="w-8 h-8" />,
      title: "Image to Video",
      description: "Bring still images to life with motion",
      color: "pink",
    },
  ];

  const otherTools = [
    {
      id: "style-transfer",
      icon: <Wand2 className="w-6 h-6" />,
      title: "Style Transfer",
      description: "Blend artistic styles into masterpieces",
    },
    {
      id: "enhance",
      icon: <Zap className="w-6 h-6" />,
      title: "Image Enhance",
      description: "Improve quality with AI",
    },
    {
      id: "background",
      icon: <ImageIcon className="w-6 h-6" />,
      title: "Background Tools",
      description: "Remove or replace backgrounds",
    },
    {
      id: "relight",
      icon: <Sun className="w-6 h-6" />,
      title: "Relight",
      description: "Transform lighting and atmosphere",
    },
    {
      id: "expand",
      icon: <Maximize2 className="w-6 h-6" />,
      title: "Image Expand",
      description: "Extend image boundaries",
    },
    {
      id: "prompt-to-video",
      icon: <Video className="w-6 h-6" />,
      title: "Prompt to Video",
      description: "Generate videos from text",
    },
  ];

  const handleSelectTool = (tool) => {
    if (tool.id === "ai-chat") {
      navigate("/ai-chat");
      return;
    }
    if (tool.id === "generate") {
      navigate("/text-to-image");
      return;
    }
    if (tool.id === "enhance") {
      navigate("/image-enhance");
      return;
    }
    if (tool.id === "background") {
      navigate("/background-tools");
      return;
    }
    if (tool.id === "style-transfer") {
      navigate("/style-transfer");
      return;
    }
    if (tool.id === "relight") {
      navigate("/relight");
      return;
    }
    if (tool.id === "expand") {
      navigate("/image-expand");
      return;
    }
    if (tool.id === "image-to-video") {
      navigate("/image-to-video");
      return;
    }
    if (tool.id === "prompt-to-video") {
      navigate("/prompt-to-video");
      return;
    }
    setSelectedTool(tool);
    setCurrentView("generation");
  };

  const handleGoBack = () => {
    setCurrentView("tool-selection");
    setSelectedTool(null);
  };

  return (
    <div className="space-y-6">
      <header
        className={`${
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-gray-200"
        } border-b -mx-6 px-6 py-5 mb-2`}
      >
        <div className="flex items-center justify-between">
          {currentView === "generation" ? (
            <button
              type="button"
              onClick={handleGoBack}
              className={`flex items-center gap-2 ${
                isDarkMode
                  ? "text-slate-400 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              } transition-colors group`}
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="font-medium text-sm">Back</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 ${
                  isDarkMode ? "bg-slate-100" : "bg-gray-900"
                } rounded-lg flex items-center justify-center`}
              >
                <Sparkles
                  className={`w-4 h-4 ${
                    isDarkMode ? "text-slate-900" : "text-white"
                  }`}
                />
              </div>
              <div>
                <h1
                  className={`text-xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  AI Studio
                </h1>
                <p
                  className={`text-xs ${
                    isDarkMode ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  Create with AI Tools
                </p>
              </div>
            </div>
          )}

          {currentView === "generation" && selectedTool && (
            <h1
              className={`text-lg font-semibold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {selectedTool.title}
            </h1>
          )}
        </div>
      </header>

      {currentView === "tool-selection" && (
        <section className="space-y-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto">
            <h2
              className={`text-2xl font-bold mb-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Choose Your AI Tool
            </h2>
            <p
              className={`text-sm ${
                isDarkMode ? "text-slate-400" : "text-gray-500"
              }`}
            >
              Select a powerful AI tool to bring your creative vision to life
            </p>
          </div>

          {/* Featured Tools */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => handleSelectTool(tool)}
                className={`group relative ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700 hover:border-slate-400 hover:shadow-lg hover:shadow-slate-900/50"
                    : "bg-white border-gray-200 hover:border-gray-900"
                } border-2 rounded-2xl p-6 text-left transition-all duration-300 overflow-hidden`}
              >
                {/* Subtle background shape */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 ${
                    isDarkMode
                      ? "bg-slate-700/50 group-hover:bg-slate-600/50"
                      : "bg-gray-50 group-hover:bg-gray-100"
                  } rounded-full -mr-16 -mt-16 transition-colors duration-300`}
                ></div>

                {/* Content */}
                <div className="relative z-10 space-y-4">
                  <div
                    className={`w-14 h-14 ${
                      isDarkMode
                        ? "bg-slate-100 text-slate-900"
                        : "bg-gray-900 text-white"
                    } rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                  >
                    {tool.icon}
                  </div>
                  <div>
                    <h3
                      className={`font-bold text-lg mb-1 ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {tool.title}
                    </h3>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      {tool.description}
                    </p>
                  </div>
                  <div
                    className={`flex items-center text-xs font-medium ${
                      isDarkMode ? "text-slate-300" : "text-gray-900"
                    } group-hover:translate-x-1 transition-transform duration-300`}
                  >
                    Get Started
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div
              className={`flex-1 h-px ${
                isDarkMode ? "bg-slate-700" : "bg-gray-200"
              }`}
            ></div>
            <span
              className={`text-xs font-medium ${
                isDarkMode ? "text-slate-500" : "text-gray-400"
              } uppercase tracking-wider`}
            >
              More Tools
            </span>
            <div
              className={`flex-1 h-px ${
                isDarkMode ? "bg-slate-700" : "bg-gray-200"
              }`}
            ></div>
          </div>

          {/* Other Tools Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {otherTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => handleSelectTool(tool)}
                className={`group ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700 hover:border-slate-500 hover:shadow-lg hover:shadow-slate-900/50"
                    : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md"
                } border rounded-xl p-4 text-left transition-all duration-200`}
              >
                <div className="space-y-3">
                  <div
                    className={`w-10 h-10 ${
                      isDarkMode
                        ? "bg-slate-700 text-slate-300 group-hover:bg-slate-100 group-hover:text-slate-900"
                        : "bg-gray-100 text-gray-700 group-hover:bg-gray-900 group-hover:text-white"
                    } rounded-lg flex items-center justify-center transition-all duration-300`}
                  >
                    {tool.icon}
                  </div>
                  <div>
                    <h4
                      className={`font-semibold text-sm mb-1 ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {tool.title}
                    </h4>
                    <p
                      className={`text-xs ${
                        isDarkMode ? "text-slate-400" : "text-gray-500"
                      } line-clamp-2`}
                    >
                      {tool.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {currentView === "generation" && selectedTool && (
        <section
          className={`${
            isDarkMode
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-gray-300"
          } border border-dashed rounded-2xl p-10 text-center`}
        >
          <div className="text-6xl mb-4">{selectedTool.icon}</div>
          <h2
            className={`text-2xl font-bold mb-2 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {selectedTool.title}
          </h2>
          <p className={`${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
            {selectedTool.description}
          </p>
          <p
            className={`${
              isDarkMode ? "text-slate-500" : "text-gray-400"
            } text-sm mt-4`}
          >
            Detailed UI for this workflow is coming soon.
          </p>
        </section>
      )}
    </div>
  );
};

export default CreateWithAI;

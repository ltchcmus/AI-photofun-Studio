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
import PremiumUpgradeCTA from "../components/common/PremiumUpgradeCTA";
import { useAuthContext } from "../context/AuthContext";

const CreateWithAI = () => {
  const [currentView, setCurrentView] = useState("tool-selection");
  const [selectedTool, setSelectedTool] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const { user } = useAuthContext();
  const navigate = useNavigate();

  // Check if user is premium
  const isPremium = Boolean(
    user?.isPremium ||
      user?.premium ||
      user?.premiumOneMonth ||
      user?.premiumSixMonths
  );

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
                } rounded-lg flex items-center justify-center group/logo hover:scale-110 transition-transform duration-300`}
              >
                <Sparkles
                  className={`w-4 h-4 ${
                    isDarkMode ? "text-slate-900" : "text-white"
                  } group-hover/logo:rotate-12 transition-transform duration-300`}
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
              } animate-fade-in`}
            >
              Choose Your AI Tool
            </h2>
            <p
              className={`text-sm ${
                isDarkMode ? "text-slate-400" : "text-gray-500"
              } animate-fade-in`}
              style={{ animationDelay: "100ms" }}
            >
              Select a powerful AI tool to bring your creative vision to life
            </p>
          </div>

          {/* Featured Tools */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredTools.map((tool, index) => (
              <button
                key={tool.id}
                onClick={() => handleSelectTool(tool)}
                className={`group/card relative ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700 hover:border-slate-400 hover:shadow-2xl hover:shadow-slate-900/60"
                    : "bg-white border-gray-200 hover:border-gray-900 hover:shadow-2xl hover:shadow-gray-900/20"
                } border-2 rounded-2xl p-6 text-left transition-all duration-500 overflow-hidden hover:-translate-y-2 hover:scale-[1.03] active:scale-[0.98] animate-fade-in`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Glow effect on hover */}
                <div
                  className={`absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 ${
                    isDarkMode
                      ? "bg-gradient-to-br from-slate-600/30 via-transparent to-slate-700/30"
                      : "bg-gradient-to-br from-gray-100/80 via-transparent to-gray-200/80"
                  }`}
                />

                {/* Subtle background shape */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 ${
                    isDarkMode
                      ? "bg-slate-700/50 group-hover/card:bg-slate-600/60"
                      : "bg-gray-50 group-hover/card:bg-gray-100"
                  } rounded-full -mr-16 -mt-16 transition-all duration-500 group-hover/card:scale-150`}
                ></div>

                {/* Content */}
                <div className="relative z-10 space-y-4">
                  <div
                    className={`relative w-14 h-14 ${
                      isDarkMode
                        ? "bg-slate-100 text-slate-900"
                        : "bg-gray-900 text-white"
                    } rounded-xl flex items-center justify-center group-hover/card:scale-110 group-hover/card:rotate-6 transition-all duration-500 overflow-hidden`}
                  >
                    <span className="relative z-10">{tool.icon}</span>
                    {/* Icon shimmer effect */}
                    <span className="absolute inset-0 -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
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
                    } group-hover/card:translate-x-2 transition-all duration-300`}
                  >
                    <span className="group-hover/card:font-semibold transition-all">
                      Get Started
                    </span>
                    <svg
                      className="w-4 h-4 ml-1 group-hover/card:translate-x-1 group-hover/card:scale-110 transition-all duration-300"
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
          <div className="flex items-center gap-4 group/divider">
            <div
              className={`flex-1 h-px transition-all duration-500 ${
                isDarkMode
                  ? "bg-slate-700 group-hover/divider:bg-slate-600"
                  : "bg-gray-200 group-hover/divider:bg-gray-300"
              }`}
            ></div>
            <span
              className={`text-xs font-medium ${
                isDarkMode ? "text-slate-500" : "text-gray-400"
              } uppercase tracking-wider transition-all duration-300 group-hover/divider:tracking-widest group-hover/divider:scale-105`}
            >
              More Tools
            </span>
            <div
              className={`flex-1 h-px transition-all duration-500 ${
                isDarkMode
                  ? "bg-slate-700 group-hover/divider:bg-slate-600"
                  : "bg-gray-200 group-hover/divider:bg-gray-300"
              }`}
            ></div>
          </div>

          {/* Other Tools Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {otherTools.map((tool, index) => (
              <button
                key={tool.id}
                onClick={() => handleSelectTool(tool)}
                className={`group/tool ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700 hover:border-slate-500 hover:shadow-xl hover:shadow-slate-900/60"
                    : "bg-white border-gray-200 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-900/10"
                } border rounded-xl p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 animate-fade-in`}
                style={{ animationDelay: `${(index + 3) * 50}ms` }}
              >
                <div className="space-y-3">
                  <div
                    className={`relative w-10 h-10 ${
                      isDarkMode
                        ? "bg-slate-700 text-slate-300 group-hover/tool:bg-slate-100 group-hover/tool:text-slate-900"
                        : "bg-gray-100 text-gray-700 group-hover/tool:bg-gray-900 group-hover/tool:text-white"
                    } rounded-lg flex items-center justify-center transition-all duration-300 group-hover/tool:scale-110 group-hover/tool:rotate-6 overflow-hidden`}
                  >
                    <span className="relative z-10">{tool.icon}</span>
                    {/* Icon glow effect */}
                    <span className="absolute inset-0 opacity-0 group-hover/tool:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/20 to-transparent" />
                  </div>
                  <div>
                    <h4
                      className={`font-semibold text-sm mb-1 transition-all duration-300 group-hover/tool:font-bold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {tool.title}
                    </h4>
                    <p
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-slate-400 group-hover/tool:text-slate-300"
                          : "text-gray-500 group-hover/tool:text-gray-600"
                      } line-clamp-2`}
                    >
                      {tool.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Premium CTA Card - Show to non-premium users */}
          {!isPremium && (
            <div className="mt-8">
              <PremiumUpgradeCTA variant="card" />
            </div>
          )}
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

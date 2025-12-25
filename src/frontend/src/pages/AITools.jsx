import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Wand2, Zap, Image as ImageIcon, Sun, Maximize2 } from "lucide-react";

const CreateWithAI = () => {
  const [currentView, setCurrentView] = useState("tool-selection");
  const [selectedTool, setSelectedTool] = useState(null);
  const navigate = useNavigate();

  const tools = [
    {
      id: "generate",
      icon: <Sparkles className="w-7 h-7 text-purple-500" />,
      title: "Text to Image",
      description: "Create visuals from your text prompts",
    },
    {
      id: "style-transfer",
      icon: <Wand2 className="w-7 h-7 text-pink-500" />,
      title: "Style Transfer",
      description: "Blend artworks into new aesthetics",
    },
    {
      id: "enhance",
      icon: <Zap className="w-7 h-7 text-yellow-500" />,
      title: "Image Enhance",
      description: "Improve clarity, lighting, and details",
    },
    {
      id: "background",
      icon: <ImageIcon className="w-7 h-7 text-green-500" />,
      title: "Background Tools",
      description: "Remove or replace any background",
    },
    {
      id: "relight",
      icon: <Sun className="w-7 h-7 text-orange-500" />,
      title: "Relight",
      description: "Change lighting and atmosphere of images",
    },
    {
      id: "expand",
      icon: <Maximize2 className="w-7 h-7 text-blue-500" />,
      title: "Image Expand",
      description: "Extend image boundaries with AI-generated content",
    },
  ];

  const handleSelectTool = (tool) => {
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
    setSelectedTool(tool);
    setCurrentView("generation");
  };

  const handleGoBack = () => {
    setCurrentView("tool-selection");
    setSelectedTool(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4 border border-gray-200 rounded-2xl px-4 py-3 bg-white shadow-sm">
        {currentView === "generation" ? (
          <button
            type="button"
            onClick={handleGoBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        ) : (
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            AI Studio
          </span>
        )}
        <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          {currentView === "tool-selection"
            ? "Create with AI"
            : selectedTool?.title}
        </h1>
        <span className="text-xs text-gray-400">Beta</span>
      </header>

      {currentView === "tool-selection" && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Choose Your Tool</h2>
            <p className="text-sm text-gray-600">
              Pick a workflow to jump straight into its dedicated experience.
            </p>
          </div>
          <div className="space-y-3">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => handleSelectTool(tool)}
                className="w-full bg-white border border-gray-200 rounded-2xl p-5 hover:bg-gray-50 transition-colors text-left flex items-center gap-4"
              >
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center shrink-0">
                  {tool.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base">{tool.title}</h3>
                  <p className="text-gray-600 text-sm">{tool.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {currentView === "generation" && selectedTool && (
        <section className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center">
          <div className="text-6xl mb-4">{selectedTool.icon}</div>
          <h2 className="text-2xl font-bold mb-2">{selectedTool.title}</h2>
          <p className="text-gray-600">{selectedTool.description}</p>
          <p className="text-gray-400 text-sm mt-4">
            Detailed UI for this workflow is coming soon.
          </p>
        </section>
      )}
    </div>
  );
};

export default CreateWithAI;

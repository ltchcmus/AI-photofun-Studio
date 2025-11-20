import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  Plus,
  Heart,
  User,
  Menu,
  Sparkles,
  Image,
  MessageCircle,
  MoreHorizontal,
  X,
  Settings,
  Moon,
  Globe,
  Gem,
  HelpCircle,
  LogOut,
} from "lucide-react";
const CreateWithAI = () => {
  const [currentView, setCurrentView] = useState("tool-selection");
  const [selectedTool, setSelectedTool] = useState(null);
  const [activeNav, setActiveNav] = useState("ai-tools");
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const menuRef = useRef(null);
  const LOGOUT_ENDPOINT = "/api/v1/identity/auth/logout";
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(LOGOUT_ENDPOINT, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch (error) {
      console.error("Logout request failed", error);
    } finally {
      localStorage.removeItem("token");
      setMenuOpen(false);
      navigate("/login");
    }
  }, [LOGOUT_ENDPOINT, navigate]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const tools = [
    {
      id: "generate",
      icon: "✨",
      title: "Text to Image",
      description: "Tạo ảnh từ mô tả văn bản",
    },
    {
      id: "style-transfer",
      icon: "🪄",
      title: "Style Transfer",
      description: "Chuyển đổi phong cách nghệ thuật",
    },
    {
      id: "enhance",
      icon: "⚡",
      title: "Image Enhance",
      description: "Nâng cao chất lượng ảnh",
    },
    {
      id: "face-swap",
      icon: "😎",
      title: "Face Swap",
      description: "Hoán đổi khuôn mặt",
    },
    {
      id: "background",
      icon: "🖼️",
      title: "Background Tools",
      description: "Xóa/thay đổi background",
    },
    {
      id: "restore",
      icon: "🩶",
      title: "Photo Restore",
      description: "Phục hồi ảnh cũ",
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
    if (tool.id === "face-swap") {
      navigate("/face-swap");
      return;
    }
    if (tool.id === "restore") {
      navigate("/photo-restore");
      return;
    }
    if (tool.id === "style-transfer") {
      navigate("/style-transfer");
      return;
    }
    setSelectedTool(tool);
    setCurrentView("generation");
    // mark 'create' as active while inside a tool generation view
    setActiveNav("create");
  };

  const handleGoBack = () => {
    setCurrentView("tool-selection");
    setSelectedTool(null);
    // return active state to AI Tools when going back
    setActiveNav("ai-tools");
  };

  const handleNavClick = (nav) => {
    setActiveNav(nav);
    setMenuOpen(false);
    if (nav === "create") {
      setCurrentView("tool-selection");
      return;
    }
    if (nav === "home") {
      // navigate back to the app's dashboard/home
      navigate("/home");
      return;
    }
    if (nav === "profile") {
      navigate("/profile");
      return;
    }
    if (nav === "activity") {
      navigate("/activity");
      return;
    }
  };

  // mirror the Dashboard navItems so sidebar is consistent
  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "search", icon: Search, label: "Search" },
    { id: "create", icon: Plus, label: "Create" },
    { id: "ai-tools", icon: Sparkles, label: "AI Tools" },
    { id: "activity", icon: Heart, label: "Activity" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  const NavButton = ({ id, children, isActive = false }) => (
    <button
      onClick={() => handleNavClick(id)}
      className={`p-3 rounded-xl transition-colors ${
        isActive ? "bg-gray-100" : "hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );

  const NavIcon = ({ isActive = false, children }) => (
    <svg
      className={`w-6 h-6 ${isActive ? "text-black" : "text-gray-600"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-20 flex-col items-center py-6 border-r border-gray-200 bg-white">
        <div className="mb-8">
          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
            <span className="text-white font-bold text-xl">@</span>
          </div>
        </div>

        <nav className="flex-1 flex flex-col items-center gap-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`p-3 rounded-xl transition-colors ${
                activeNav === item.id ? "bg-gray-100" : "hover:bg-gray-50"
              }`}
              title={item.label}
            >
              <item.icon
                className={`w-6 h-6 ${
                  activeNav === item.id ? "text-black" : "text-gray-600"
                }`}
              />
            </button>
          ))}
        </nav>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="p-3 hover:bg-gray-50 rounded-xl transition-colors"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Sidebar menu"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          {menuOpen && (
            <div className="absolute left-14 bottom-0 w-60 bg-white border border-gray-200 rounded-2xl shadow-2xl p-3 text-sm space-y-2">
              <button
                type="button"
                className="flex items-center gap-2 w-full px-2 py-2 rounded-lg hover:bg-gray-50 font-semibold text-gray-900"
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
              <button
                type="button"
                onClick={() => setDarkMode((prev) => !prev)}
                className="flex items-center justify-between w-full px-2 py-2 rounded-lg hover:bg-gray-50"
              >
                <span className="flex items-center gap-2 font-semibold text-gray-900">
                  <Moon className="w-4 h-4" /> Dark Mode
                </span>
                <span className="text-xs text-gray-500">
                  {darkMode ? "On" : "Off"}
                </span>
              </button>
              <button
                type="button"
                className="flex items-center justify-between w-full px-2 py-2 rounded-lg hover:bg-gray-50"
              >
                <span className="flex items-center gap-2 font-semibold text-gray-900">
                  <Globe className="w-4 h-4" /> Language
                </span>
                <span className="text-xs text-gray-500">English</span>
              </button>
              <hr className="border-gray-200" />
              <button
                type="button"
                className="flex items-center gap-2 w-full px-2 py-2 rounded-lg hover:bg-gray-50 font-semibold text-gray-900"
              >
                <Gem className="w-4 h-4 text-yellow-500" /> Upgrade to Premium
              </button>
              <button
                type="button"
                className="flex items-center gap-2 w-full px-2 py-2 rounded-lg hover:bg-gray-50 font-semibold text-gray-900"
              >
                <HelpCircle className="w-4 h-4" /> Help & Support
              </button>
              <hr className="border-gray-200" />
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-2 py-2 rounded-lg hover:bg-red-50 text-red-600 font-semibold"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-20 flex-1 pb-16 md:pb-0">
        {/* Top Bar */}
        <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center justify-between">
              {currentView === "generation" && (
                <button
                  onClick={handleGoBack}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back
                </button>
              )}
              <h1 className="text-lg md:text-xl font-bold">
                {currentView === "tool-selection"
                  ? "Create with AI"
                  : selectedTool?.title}
              </h1>
            </div>
          </div>
        </header>

        {/* Tool Selection View */}
        {currentView === "tool-selection" && (
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-bold mb-2">
                Choose Your Tool
              </h2>
              <p className="text-gray-600 text-sm">
                Select an AI tool to start creating
              </p>
            </div>

            <div className="space-y-3">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleSelectTool(tool)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors text-left flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl shrink-0">
                    {tool.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-0.5">
                      {tool.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{tool.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Generation View */}
        {currentView === "generation" && selectedTool && (
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">{selectedTool.icon}</div>
              <h2 className="text-2xl font-bold mb-2">{selectedTool.title}</h2>
              <p className="text-gray-600">{selectedTool.description}</p>
              <p className="text-gray-400 text-sm mt-4">
                Tool interface coming soon...
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-around">
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className="p-2.5"
          >
            <item.icon
              className={`w-6 h-6 ${
                activeNav === item.id ? "text-black" : "text-gray-400"
              }`}
            />
          </button>
        ))}
      </nav>
    </div>
  );
};

export default CreateWithAI;

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Gem,
  Globe,
  HelpCircle,
  LogOut,
  Menu,
  Moon,
  Settings,
} from "lucide-react";
import { navItems } from "../../config/navConfig";
import { useAuth } from "../../hooks/useAuth";

const DEFAULT_AVATAR = "https://placehold.co/40x40/111/fff?text=U";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = location.pathname;
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const menuRef = useRef(null);
  const { user, logout } = useAuth();

  const displayName = user?.fullName || "Người dùng";
  const avatarUrl = user?.avatar || DEFAULT_AVATAR;

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to logout", error);
    } finally {
      setMenuOpen(false);
    }
  }, [logout, navigate]);

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

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-20 flex-col items-center py-6 border-r border-gray-200 bg-white">
      <div className="mb-8 flex flex-col items-center text-center">
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-12 h-12 rounded-2xl object-cover border border-gray-200"
        />
        <p className="mt-2 text-sm font-semibold text-gray-800 line-clamp-2">
          {displayName}
        </p>
      </div>

      <nav className="flex-1 flex flex-col items-center gap-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activePath === item.path || activePath.startsWith(item.path + "/");
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`p-3 rounded-xl transition-colors ${
                isActive ? "bg-gray-100" : "hover:bg-gray-50"
              }`}
              title={item.label}
            >
              <Icon
                className={`w-6 h-6 ${
                  isActive ? "text-black" : "text-gray-600"
                }`}
              />
            </button>
          );
        })}
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
              onClick={() => {
                setMenuOpen(false);
                navigate("/settings");
              }}
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
                {darkMode ? "Bật" : "Tắt"}
              </span>
            </button>
            <button
              type="button"
              className="flex items-center justify-between w-full px-2 py-2 rounded-lg hover:bg-gray-50"
            >
              <span className="flex items-center gap-2 font-semibold text-gray-900">
                <Globe className="w-4 h-4" /> Language
              </span>
              <span className="text-xs text-gray-500">Tiếng Việt</span>
            </button>
            <hr className="border-gray-200" />
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                navigate("/pricing");
              }}
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
              <LogOut className="w-4 h-4" /> Log out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

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
  Crown,
  Coins,
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
  const isPremium = Boolean(
    user?.isPremium ||
    user?.premium ||
    user?.premiumOneMonth ||
    user?.premiumSixMonths
  );

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
        {/* Premium Avatar with Frame */}
        <div className="relative group">
          {isPremium && (
            <div
              className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-2xl animate-spin-slow opacity-75 group-hover:opacity-100 transition-opacity"
              style={{ animationDuration: "3s" }}
            />
          )}
          <div
            className={`relative ${isPremium
              ? "p-0.5 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-2xl"
              : ""
              }`}
          >
            <img
              src={avatarUrl}
              alt={displayName}
              className={`w-12 h-12 rounded-2xl object-cover bg-white ${isPremium ? "border-0" : "border border-gray-200"
                }`}
            />
          </div>
          {/* Premium Crown Badge */}
          {isPremium && (
            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-0.5 shadow-lg">
              <Crown className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
        <p
          className={`mt-2 text-sm font-semibold line-clamp-2 ${isPremium
            ? "bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 bg-clip-text text-transparent"
            : "text-gray-800"
            }`}
        >
          {displayName}
        </p>
        {isPremium && (
          <span className="mt-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white">
            <Crown className="w-2 h-2" />
            PRO
          </span>
        )}
        {/* Tokens Display */}
        <div className="mt-2 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200">
          <Coins className="w-3 h-3 text-yellow-600" />
          <span className="text-xs font-bold text-yellow-700">
            {user?.tokens?.toLocaleString() ?? 0}
          </span>
        </div>
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
              className={`p-3 rounded-xl transition-colors ${isActive ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
              title={item.label}
            >
              <Icon
                className={`w-6 h-6 ${isActive ? "text-black" : "text-gray-600"
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

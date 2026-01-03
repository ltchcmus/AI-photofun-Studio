import React, { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import Sidebar from "../components/layout/Sidebar";
import { navItems } from "../config/navConfig";
import PremiumAvatar from "../components/ui/PremiumAvatar";

const fallbackUser = {
  username: "Guest",
  avatarUrl: "https://i.pravatar.cc/150?img=32",
  isPremium: false,
};

const PremiumLayout = ({ user: suppliedUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = location.pathname;

  const resolvedUser = useMemo(() => {
    if (suppliedUser) return suppliedUser;
    try {
      const stored = localStorage.getItem("userProfile");
      if (stored) return JSON.parse(stored);
    } catch (error) {
      console.warn("Unable to parse stored user profile", error);
    }
    return fallbackUser;
  }, [suppliedUser]);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <main className="md:ml-20 flex-1 pb-16 md:pb-0">
        <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Premium Workspace
              </p>
              <h1 className="text-lg md:text-xl font-bold text-gray-900">
                Welcome back
                {resolvedUser?.username ? `, ${resolvedUser.username}` : ""}
              </h1>
              {resolvedUser?.isPremium ? (
                <p className="text-sm text-amber-600 font-medium flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  Premium membership active
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Upgrade to unlock premium tools
                </p>
              )}
            </div>
            <PremiumAvatar user={resolvedUser} size={56} />
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <Outlet context={{ user: resolvedUser }} />
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-around z-20">
        {navItems.slice(0, 5).map((item) => {
          const Icon = Icons[item.icon.displayName] || Icons.Home;
          const isActive =
            activePath === item.path || activePath.startsWith(item.path + "/");
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="p-2.5 cursor-pointer"
            >
              <Icon
                className={`w-6 h-6 ${
                  isActive ? "text-black" : "text-gray-400"
                }`}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default PremiumLayout;

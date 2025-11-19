import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import { navItems } from "../config/navConfig";
import * as Icons from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = location.pathname;

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <main className="md:ml-20 flex-1 pb-16 md:pb-0">
        <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
            {/* global header content can go here */}
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <Outlet />
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
              className="p-2.5"
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

export default AppLayout;

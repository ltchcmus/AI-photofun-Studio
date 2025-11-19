import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { navItems } from "../../config/navConfig";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = location.pathname;

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-20 flex-col items-center py-6 border-r border-gray-200 bg-white">
      <div className="mb-8">
        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
          <span className="text-white font-bold text-xl">@</span>
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

      <button className="p-3 hover:bg-gray-50 rounded-xl transition-colors">
        <svg
          className="w-6 h-6 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </aside>
  );
};

export default Sidebar;

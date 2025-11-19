import { Home, Search, Plus, Sparkles, Heart, User } from "lucide-react";

export const navItems = [
  { id: "home", icon: Home, label: "Home", path: "/dashboard" },
  { id: "search", icon: Search, label: "Search", path: "/search" },
  { id: "create", icon: Plus, label: "Create", path: "/create" },
  { id: "ai-tools", icon: Sparkles, label: "AI Tools", path: "/ai-tools" },
  { id: "activity", icon: Heart, label: "Activity", path: "/activity" },
  { id: "profile", icon: User, label: "Profile", path: "/profile" },
];

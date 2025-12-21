import {
  Home,
  Plus,
  Sparkles,
  Heart,
  User,
  MessageCircle,
} from "lucide-react";

export const navItems = [
  { id: "home", icon: Home, label: "Home", path: "/dashboard" },
  { id: "create", icon: Plus, label: "Post", path: "/dashboard?create=true" },
  { id: "ai-tools", icon: Sparkles, label: "AI Tools", path: "/ai-tools" },
  { id: "activity", icon: Heart, label: "Activity", path: "/activity" },
  { id: "messages", icon: MessageCircle, label: "Messages", path: "/messages" },
  { id: "profile", icon: User, label: "Profile", path: "/profile" },
];


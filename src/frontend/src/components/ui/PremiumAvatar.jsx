import React from "react";
import { Crown } from "lucide-react";

const PremiumAvatar = ({ user, size = 48 }) => {
  const dimensionClass =
    size >= 64 ? "h-16 w-16" : size >= 56 ? "h-14 w-14" : "h-12 w-12";
  const badgeSizeClass = size >= 56 ? "h-6 w-6" : "h-5 w-5";

  return (
    <div className="relative inline-block">
      <img
        src={user?.avatarUrl}
        alt={user?.username || "User avatar"}
        className={`${dimensionClass} rounded-full object-cover ${
          user?.isPremium ? "ring-2 ring-yellow-500 ring-offset-2" : ""
        }`}
      />
      {user?.isPremium && (
        <div
          className={`absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-yellow-500 text-white ring-2 ring-white ${badgeSizeClass}`}
        >
          <Crown className="w-3 h-3" />
        </div>
      )}
    </div>
  );
};

export default PremiumAvatar;

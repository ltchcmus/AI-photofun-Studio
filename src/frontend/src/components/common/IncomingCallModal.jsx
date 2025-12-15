import React from "react";
import { Phone, Video, PhoneOff, User } from "lucide-react";

const IncomingCallModal = ({
  isOpen,
  onAccept,
  onReject,
  callerName,
  callerAvatar,
  isVideoCall = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-blue-600 to-blue-700 p-8 shadow-2xl animate-in zoom-in duration-300">
        {/* Caller Info */}
        <div className="flex flex-col items-center text-white">
          {/* Avatar */}
          <div className="relative mb-6">
            <div className="absolute inset-0 animate-ping rounded-full bg-white/30"></div>
            <img
              src={callerAvatar || `https://i.pravatar.cc/150?u=${callerName}`}
              alt={callerName}
              className="relative h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg"
            />
          </div>

          {/* Call Type */}
          <div className="mb-2 flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-sm">
            {isVideoCall ? (
              <Video className="h-4 w-4" />
            ) : (
              <Phone className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {isVideoCall ? "Cuộc gọi video" : "Cuộc gọi thoại"}
            </span>
          </div>

          {/* Caller Name */}
          <h3 className="mb-2 text-2xl font-bold">{callerName}</h3>
          <p className="text-sm text-blue-100">Đang gọi cho bạn...</p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-center gap-6">
          {/* Reject Button */}
          <button
            type="button"
            onClick={onReject}
            className="group flex flex-col items-center gap-2 transition-transform hover:scale-110"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg transition-all group-hover:bg-red-600 group-hover:shadow-xl">
              <PhoneOff className="h-7 w-7 text-white" />
            </div>
            <span className="text-xs font-medium text-white">Từ chối</span>
          </button>

          {/* Accept Button */}
          <button
            type="button"
            onClick={onAccept}
            className="group flex flex-col items-center gap-2 transition-transform hover:scale-110"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 shadow-lg transition-all group-hover:bg-green-600 group-hover:shadow-xl">
              <Phone className="h-7 w-7 text-white" />
            </div>
            <span className="text-xs font-medium text-white">Trả lời</span>
          </button>
        </div>

        {/* Ripple Effect */}
        <div className="absolute inset-0 -z-10 animate-pulse rounded-3xl bg-blue-400 opacity-50 blur-xl"></div>
      </div>
    </div>
  );
};

export default IncomingCallModal;

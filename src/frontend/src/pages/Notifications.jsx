import React, { useMemo, useState } from "react";
import {
  AtSign,
  BellRing,
  Heart,
  MessageCircle,
  MoreHorizontal,
  UserPlus,
} from "lucide-react";

const filters = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
];

const notificationTypeMeta = {
  like: {
    icon: Heart,
    iconClass: "text-red-500",
  },
  comment: {
    icon: MessageCircle,
    iconClass: "text-blue-500",
  },
  follow: {
    icon: UserPlus,
    iconClass: "text-purple-500",
  },
  mention: {
    icon: AtSign,
    iconClass: "text-blue-500",
  },
};

const notifications = [
  {
    id: 1,
    initials: "AC",
    username: "alex_chen",
    action: "liked your artwork",
    timeAgo: "2 minutes ago",
    type: "like",
    previewImage:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop",
    isUnread: true,
  },
  {
    id: 2,
    initials: "SK",
    username: "sarah_kim",
    action: "commented on your post",
    comment: "This is amazing! Love the colors 🎨",
    timeAgo: "15 minutes ago",
    type: "comment",
    previewImage:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=100&h=100&fit=crop",
    isUnread: true,
  },
  {
    id: 3,
    initials: "MC",
    username: "mike_creates",
    action: "started following you",
    timeAgo: "1 hour ago",
    type: "follow",
    ctaLabel: "Follow",
    isUnread: true,
  },
  {
    id: 4,
    initials: "EW",
    username: "emma_wilson",
    action: "liked your artwork",
    timeAgo: "2 hours ago",
    type: "like",
    previewImage:
      "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=100&h=100&fit=crop",
    isUnread: true,
  },
  {
    id: 5,
    initials: "DL",
    username: "david_lee",
    action: "commented on your post",
    comment: "Great work! What prompt did you use?",
    timeAgo: "3 hours ago",
    type: "comment",
    previewImage:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop",
    isUnread: false,
  },
  {
    id: 6,
    initials: "LP",
    username: "lisa_park",
    action: "and 5 others liked your artwork",
    timeAgo: "5 hours ago",
    type: "like",
    previewImage:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=100&h=100&fit=crop",
    isUnread: false,
  },
  {
    id: 7,
    initials: "JD",
    username: "john_doe",
    action: "started following you",
    timeAgo: "1 day ago",
    type: "follow",
    ctaLabel: "Follow",
    isUnread: false,
  },
  {
    id: 8,
    initials: "AS",
    username: "anna_smith",
    action: "mentioned you in a comment",
    comment: "@your_username check this out!",
    timeAgo: "2 days ago",
    type: "mention",
    previewImage:
      "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=100&h=100&fit=crop",
    isUnread: false,
  },
];

const Notifications = () => {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "unread") {
      return notifications.filter((notification) => notification.isUnread);
    }
    return notifications;
  }, [activeFilter]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="bg-white border border-gray-200 rounded-2xl shadow-sm px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
            <BellRing className="w-5 h-5 text-gray-900" />
            Notifications
          </h1>
          <span className="text-xs text-gray-500">Updated just now</span>
        </div>
        <div className="flex gap-6 mt-4">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`relative pb-3 text-sm font-semibold capitalize transition-colors cursor-pointer ${
                activeFilter === filter.id
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {filter.label}
              {activeFilter === filter.id && (
                <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </header>

      <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-200">
        {filteredNotifications.map((notification) => {
          const typeMeta = notificationTypeMeta[notification.type];
          const TypeIcon = typeMeta?.icon ?? Heart;

          return (
            <article
              key={notification.id}
              className={`px-4 md:px-6 py-4 transition-colors ${
                notification.isUnread
                  ? "bg-blue-50/70 hover:bg-blue-50"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-sm text-gray-700">
                    {notification.initials}
                  </div>
                  {TypeIcon && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                      <TypeIcon
                        className={`w-3.5 h-3.5 ${
                          typeMeta?.iconClass ?? "text-gray-500"
                        }`}
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">
                          {notification.username}
                        </span>
                        <span className="text-gray-600">
                          {" "}
                          {notification.action}
                        </span>
                      </p>
                      {notification.comment && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-100 rounded-xl px-3 py-2">
                          {notification.comment}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {notification.timeAgo}
                      </p>
                    </div>

                    {notification.previewImage && (
                      <img
                        src={notification.previewImage}
                        alt="Notification preview"
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                      />
                    )}

                    {notification.ctaLabel && (
                      <button
                        type="button"
                        className="px-4 py-1.5 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800 cursor-pointer"
                      >
                        {notification.ctaLabel}
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="p-1 text-gray-500 hover:text-gray-900 rounded-lg flex-shrink-0 cursor-pointer"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </article>
          );
        })}

        {!filteredNotifications.length && (
          <div className="px-6 py-16 text-center space-y-3">
            <p className="text-base font-semibold text-gray-900">
              Nothing to see yet
            </p>
            <p className="text-sm text-gray-500">
              You are all caught up on your notifications.
            </p>
          </div>
        )}
      </section>

      <div className="text-center pt-2">
        <button
          type="button"
          className="text-sm font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
        >
          Load more notifications
        </button>
      </div>
    </div>
  );
};

export default Notifications;

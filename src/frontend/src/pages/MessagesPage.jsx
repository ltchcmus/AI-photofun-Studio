import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Send,
  Image,
  Search,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Users,
  X,
  Crown,
  Loader2,
} from "lucide-react";
import io from "socket.io-client";
import { useAuth } from "../hooks/useAuth";
import { communicationApi } from "../api/communicationApi";
import { useSearchParams } from "react-router-dom";

const SOCKET_URL = "http://localhost:8899";

const MessagesPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // State
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState("direct"); // "direct" or "groups"
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Fetch conversations from API
  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await communicationApi.getMyConversations();
      const data = response?.data?.result || [];

      const formattedConversations = data.map((conv) => ({
        id: conv.userId,
        userId: conv.userId,
        name: conv.username || "Người dùng",
        avatar: conv.avatarUrl || `https://i.pravatar.cc/150?u=${conv.userId}`,
        lastMessage: "",
        time: "",
        unread: 0,
        isOnline: false,
      }));

      setConversations(formattedConversations);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch groups from API
  const fetchGroups = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await communicationApi.getAllGroups(1, 50);
      const data = response?.data?.result?.items || [];

      const formattedGroups = data.map((group) => ({
        id: group.groupId,
        groupId: group.groupId,
        name: group.name || "Nhóm",
        avatar: group.image || `https://i.pravatar.cc/150?u=${group.groupId}`,
        lastMessage: "",
        time: "",
        unread: 0,
        memberCount: 0,
        isGroup: true,
        adminId: group.adminId,
      }));

      setGroups(formattedGroups);
      console.log("✅ Fetched groups:", formattedGroups);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  }, [user?.id]);

  // Fetch messages for active chat
  const fetchMessages = useCallback(async () => {
    if (!activeChat) return;

    try {
      let response;

      if (activeChat.isGroup) {
        // Fetch group messages
        response = await communicationApi.getGroupMessages(
          activeChat.groupId,
          1,
          50
        );
      } else {
        // Fetch 1-1 messages
        if (!activeChat.userId) return;
        response = await communicationApi.getMessages(activeChat.userId, 1, 50);
      }

      const data = response?.data?.result?.data || response?.data?.result || [];

      const formattedMessages = data.map((msg) => ({
        id: msg.id || Date.now(),
        sender: msg.senderId === user?.id ? "me" : "other",
        text: msg.message || msg.content || "",
        time: msg.createdAt
          ? new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      setMessages([]);
    }
  }, [activeChat, user?.id]);

  // Socket.IO connection
  useEffect(() => {
    if (!user?.id || socketRef.current) return;

    console.log("🔌 Connecting to communication socket...");

    const newSocket = io(`${SOCKET_URL}?userId=${user.id}`, {
      transports: ["websocket", "polling"],
      reconnectionDelay: 2000,
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 10000,
      autoConnect: true,
      path: "/socket.io",
    });

    newSocket.on("connect", () => {
      console.log("✅ Connected to communication socket:", newSocket.id);
      setSocketConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from socket:", reason);
      setSocketConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("🔥 Connection error:", error);
      setSocketConnected(false);
    });

    // Receive 1-1 message
    newSocket.on("receiveMessage", (data) => {
      console.log("📨 Received 1-1 message:", data);

      // Add message to current chat if it matches
      if (activeChat?.userId === data.senderId) {
        const newMsg = {
          id: Date.now(),
          sender: "other",
          text: data.message,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, newMsg]);
      }
    });

    // Receive group message
    newSocket.on("receiveGroupMessage", (data) => {
      console.log("📨 Received group message:", data);

      // Add message to current chat if it matches
      if (activeChat?.groupId === data.groupId) {
        const newMsg = {
          id: Date.now(),
          sender: data.senderId === user.id ? "me" : "other",
          text: data.message,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, newMsg]);
      }
    });

    socketRef.current = newSocket;

    return () => {
      console.log("🔌 Cleaning up socket connection...");
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [user?.id, activeChat?.userId, activeChat?.groupId]);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      fetchMessages();
    }
  }, [activeChat, fetchMessages]);

  // Fetch groups when switching to groups tab
  useEffect(() => {
    if (activeTab === "groups") {
      fetchGroups();
    }
  }, [activeTab, fetchGroups]);

  // Auto-select conversation based on URL param or first conversation
  useEffect(() => {
    if (conversations.length === 0) return;

    const userIdFromUrl = searchParams.get("userId");

    if (userIdFromUrl) {
      // Find and select conversation with userId from URL
      const targetConversation = conversations.find(
        (conv) => conv.userId === userIdFromUrl
      );

      if (targetConversation) {
        setActiveChat(targetConversation);
        console.log("✅ Auto-selected conversation from URL:", userIdFromUrl);
      } else {
        // If conversation not found, select first one
        setActiveChat(conversations[0]);
      }
    } else if (!activeChat) {
      // No URL param, select first conversation
      setActiveChat(conversations[0]);
    }
  }, [conversations, searchParams, activeChat]);

  // Scroll to bottom when new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (event) => {
    event.preventDefault();
    if (
      !inputMessage.trim() ||
      !socketRef.current ||
      !socketConnected ||
      !activeChat
    )
      return;

    // Check if it's a group chat or 1-1 chat
    if (activeChat.isGroup) {
      // Send group message
      const messageData = {
        senderId: user.id,
        groupId: activeChat.groupId,
        message: inputMessage,
        isImage: false,
      };

      socketRef.current.emit("sendMessageToGroup", messageData);
      console.log("📤 Sent group message:", messageData);
    } else {
      // Send 1-1 message
      const messageData = {
        senderId: user.id,
        receiverId: activeChat.userId,
        message: inputMessage,
        isImage: false,
      };

      socketRef.current.emit("sendMessage", messageData);
      console.log("📤 Sent message:", messageData);
    }

    // Add to local messages immediately
    const newMessage = {
      id: Date.now(),
      sender: "me",
      text: inputMessage,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      const response = await communicationApi.createGroup(newGroupName);
      console.log("✅ Group created:", response);

      alert(`Tạo nhóm "${newGroupName}" thành công!`);
      setShowCreateGroup(false);
      setNewGroupName("");

      // Refresh groups list if on groups tab
      if (activeTab === "groups") {
        fetchGroups();
      }
    } catch (error) {
      console.error("Failed to create group:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Không thể tạo nhóm. Vui lòng thử lại!";
      alert(errorMsg);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 rounded-3xl border border-gray-200">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Đang tải cuộc trò chuyện...</p>
        </div>
      </div>
    );
  }

  // No conversations state
  if (!activeChat && conversations.length === 0) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 rounded-3xl border border-gray-200">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Users className="h-16 w-16 text-gray-300" />
          <p className="text-lg font-medium">Chưa có cuộc trò chuyện</p>
          <p className="text-sm text-gray-400">
            Bắt đầu nhắn tin với bạn bè ngay!
          </p>
        </div>
      </div>
    );
  }

  if (!activeChat) {
    return null;
  }

  const isPremium =
    user?.isPremium || user?.premiumOneMonth || user?.premiumSixMonths;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden rounded-3xl border border-gray-200 shadow-sm">
      <div className="flex w-80 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-800">Đoạn chat</h1>
              <div
                className={`h-2 w-2 rounded-full ${
                  socketConnected ? "bg-green-500" : "bg-red-500"
                }`}
                title={socketConnected ? "Đã kết nối" : "Mất kết nối"}
              />
            </div>
            {isPremium && (
              <button
                type="button"
                onClick={() => setShowCreateGroup(true)}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all hover:scale-105"
                title="Tạo nhóm (Premium)"
              >
                <Users className="h-4 w-4" />
                <span>Tạo nhóm</span>
                <Crown className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm"
              className="w-full rounded-full bg-gray-100 py-2 pl-10 pr-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => setActiveTab("direct")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === "direct"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Trực tiếp
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("groups")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === "groups"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Nhóm
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === "direct" ? (
            conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Users className="h-12 w-12 mb-3 text-gray-300" />
                <p className="text-sm">Chưa có cuộc trò chuyện</p>
              </div>
            ) : (
              conversations.map((chat) => (
                <button
                  type="button"
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={`mx-2 mb-2 flex items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                    activeChat.id === chat.id
                      ? "bg-blue-50"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={chat.avatar}
                      alt={chat.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    {chat.isOnline && (
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500"></span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between">
                      <h3
                        className={`truncate text-sm font-semibold ${
                          activeChat.id === chat.id
                            ? "text-blue-700"
                            : "text-gray-900"
                        }`}
                      >
                        {chat.name}
                      </h3>
                      <span className="text-xs text-gray-400">{chat.time}</span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between">
                      <p
                        className={`max-w-[140px] truncate text-xs ${
                          chat.unread
                            ? "font-bold text-gray-900"
                            : "text-gray-500"
                        }`}
                      >
                        {chat.lastMessage}
                      </p>
                      {chat.unread > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )
          ) : // Groups Tab
          groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Users className="h-12 w-12 mb-3 text-gray-300" />
              <p className="text-sm">Chưa có nhóm</p>
              {isPremium && (
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(true)}
                  className="mt-3 text-sm text-blue-600 hover:underline"
                >
                  Tạo nhóm mới
                </button>
              )}
            </div>
          ) : (
            groups.map((group) => (
              <button
                type="button"
                key={group.id}
                onClick={() => setActiveChat(group)}
                className={`mx-2 mb-2 flex items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                  activeChat?.id === group.id
                    ? "bg-blue-50"
                    : "hover:bg-gray-100"
                }`}
              >
                <div className="relative">
                  <img
                    src={group.avatar}
                    alt={group.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <span className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white border-2 border-white">
                    <Users className="h-2.5 w-2.5" />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between">
                    <h3
                      className={`truncate text-sm font-semibold ${
                        activeChat?.id === group.id
                          ? "text-blue-700"
                          : "text-gray-900"
                      }`}
                    >
                      {group.name}
                    </h3>
                    <span className="text-xs text-gray-400">{group.time}</span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between">
                    <p className="max-w-[140px] truncate text-xs text-gray-500">
                      {group.lastMessage ||
                        `${group.memberCount || 0} thành viên`}
                    </p>
                    {group.unread > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                        {group.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-white">
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={activeChat.avatar}
                alt={activeChat.name}
                className="h-10 w-10 rounded-full object-cover"
              />
              {activeChat.isOnline && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {activeChat.name}
              </p>
              <p className="text-xs text-gray-500">
                {activeChat.isOnline ? "Đang hoạt động" : "Hoạt động gần đây"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-blue-600">
            <button
              type="button"
              className="rounded-full p-2 transition-colors hover:bg-blue-50"
            >
              <Phone className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="rounded-full p-2 transition-colors hover:bg-blue-50"
            >
              <Video className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="rounded-full p-2 transition-colors hover:bg-blue-50"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-white p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Send className="h-16 w-16 mb-3 text-gray-300" />
              <p className="text-sm">Chưa có tin nhắn</p>
              <p className="text-xs mt-1">Bắt đầu cuộc trò chuyện ngay!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "me" ? "justify-end" : "justify-start"
                }`}
              >
                {message.sender === "other" && (
                  <img
                    src={activeChat.avatar}
                    alt={activeChat.name}
                    className="mr-2 h-8 w-8 rounded-full object-cover self-end"
                  />
                )}
                <div
                  className={`group relative max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                    message.sender === "me"
                      ? "rounded-br-none bg-blue-600 text-white"
                      : "rounded-bl-none bg-gray-100 text-gray-800"
                  }`}
                >
                  {message.text}
                  <span
                    className={`pointer-events-none absolute bottom-full mb-1 text-[10px] text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 ${
                      message.sender === "me" ? "right-0" : "left-0"
                    }`}
                  >
                    {message.time}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-100 p-4">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              className="rounded-full p-2 text-blue-600 transition-colors hover:bg-blue-50"
            >
              <Image className="h-6 w-6" />
            </button>
            <button
              type="button"
              className="rounded-full p-2 text-blue-600 transition-colors hover:bg-blue-50"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <div className="relative flex-1">
              <input
                type="text"
                value={inputMessage}
                onChange={(event) => setInputMessage(event.target.value)}
                placeholder={
                  socketConnected ? "Nhập tin nhắn..." : "Đang kết nối..."
                }
                disabled={!socketConnected}
                className="w-full rounded-full bg-gray-100 py-2.5 pl-4 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-blue-600"
              >
                <Smile className="h-5 w-5" />
              </button>
            </div>
            <button
              type="submit"
              disabled={!inputMessage.trim() || !socketConnected}
              className="rounded-full bg-blue-600 p-3 text-white shadow-md transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">
                  Tạo nhóm mới
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateGroup(false);
                  setNewGroupName("");
                }}
                className="rounded-full p-2 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50 border border-yellow-200">
              <div className="flex items-center gap-2 text-sm">
                <Crown className="h-4 w-4 text-orange-500" />
                <span className="text-gray-700">
                  Tính năng dành cho thành viên{" "}
                  <span className="font-bold text-transparent bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 bg-clip-text">
                    Premium
                  </span>
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên nhóm
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Nhập tên nhóm..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newGroupName.trim()) {
                      handleCreateGroup();
                    }
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateGroup(false);
                    setNewGroupName("");
                  }}
                  className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Users className="h-4 w-4" />
                  Tạo nhóm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;

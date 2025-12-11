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
  LogOut,
  UserMinus,
  UserPlus,
  Check,
  XCircle,
  Settings,
  ChevronRight,
  Shield,
  Camera,
} from "lucide-react";
import io from "socket.io-client";
import { useAuth } from "../hooks/useAuth";
import { communicationApi } from "../api/communicationApi";
import { userApi } from "../api/userApi";
import { useSearchParams, useNavigate } from "react-router-dom";

const SOCKET_URL = "http://localhost:8899";

const MessagesPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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

  // Group Management State
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [userCache, setUserCache] = useState({}); // Cache user info { odId: { username, avatarUrl } }
  const [uploadingImage, setUploadingImage] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const imageInputRef = useRef(null);

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

      const formattedGroups = data.map((group) => {
        const memberIds = group.memberIds || [];
        const isMember = memberIds.includes(user.id) || group.adminId === user.id;
        console.log(`📋 Group "${group.name}": memberIds=${JSON.stringify(memberIds)}, userId=${user.id}, adminId=${group.adminId}, isMember=${isMember}`);

        return {
          id: group.groupId,
          groupId: group.groupId,
          name: group.name || "Nhóm",
          avatar: group.image || `https://i.pravatar.cc/150?u=${group.groupId}`,
          lastMessage: "",
          time: "",
          unread: 0,
          memberCount: memberIds.length || 0,
          isGroup: true,
          adminId: group.adminId,
          memberIds: memberIds,
          isMember: isMember,
          isAdmin: group.adminId === user.id,
        };
      });

      setGroups(formattedGroups);
      console.log("✅ Fetched groups:", formattedGroups);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  }, [user?.id]);

  // Fetch group members
  const fetchGroupMembers = useCallback(async (groupId) => {
    try {
      const response = await communicationApi.getGroupMembers(groupId);
      const members = response?.data?.result || [];
      setGroupMembers(members);
    } catch (error) {
      console.error("Failed to fetch group members:", error);
      setGroupMembers([]);
    }
  }, []);

  // Fetch pending join requests (for admin only)
  const fetchPendingRequests = useCallback(async (groupId) => {
    try {
      const response = await userApi.getMemberRequests(1, 50);
      const allRequests = response?.data?.result?.items || [];
      // Filter requests for this specific group
      const groupRequests = allRequests.filter(
        (req) => req.groupId === groupId
      );
      setPendingRequests(groupRequests);
      console.log("✅ Fetched pending requests:", groupRequests);
    } catch (error) {
      console.error("Failed to fetch pending requests:", error);
      setPendingRequests([]);
    }
  }, []);

  // Fetch messages for active chat
  const fetchMessages = useCallback(async () => {
    if (!activeChat) return;

    try {
      let response;
      let data = [];

      if (activeChat.isGroup) {
        // Fetch group messages - response has result.items
        response = await communicationApi.getGroupMessages(
          activeChat.groupId,
          1,
          50
        );
        data = response?.data?.result?.items || [];
        console.log("📨 Group messages response:", response?.data);

        // Get unique senderIds that we don't have in cache
        const uniqueSenderIds = [...new Set(data.map((msg) => msg.senderId))];
        const uncachedIds = uniqueSenderIds.filter(
          (id) => id && id !== user?.id && !userCache[id]
        );

        // Fetch user info for uncached senderIds
        if (uncachedIds.length > 0) {
          const userPromises = uncachedIds.map(async (senderId) => {
            try {
              const userRes = await userApi.getUserById(senderId);
              const userData = userRes?.data?.result;
              const isPremium = Boolean(
                userData?.isPremium ||
                userData?.premiumOneMonth ||
                userData?.premiumSixMonths
              );
              return {
                id: senderId,
                username: userData?.username || userData?.fullName || "User",
                avatarUrl: userData?.avatarUrl || `https://i.pravatar.cc/150?u=${senderId}`,
                isPremium: isPremium,
              };
            } catch (err) {
              console.warn(`Failed to fetch user ${senderId}:`, err);
              return {
                id: senderId,
                username: "User",
                avatarUrl: `https://i.pravatar.cc/150?u=${senderId}`,
                isPremium: false,
              };
            }
          });

          const usersData = await Promise.all(userPromises);
          const newCache = { ...userCache };
          usersData.forEach((u) => {
            newCache[u.id] = { username: u.username, avatarUrl: u.avatarUrl, isPremium: u.isPremium };
          });
          setUserCache(newCache);
        }
      } else {
        // Fetch 1-1 messages - response has result.data or result directly
        if (!activeChat.userId) return;
        response = await communicationApi.getMessages(activeChat.userId, 1, 50);
        data = response?.data?.result?.data || response?.data?.result || [];
      }

      // Helper function to detect if a message is an image URL
      const isImageUrl = (text) => {
        if (!text || typeof text !== 'string') return false;
        // Check common image extensions
        const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i;
        // Check common image hosting services
        const imageHosts = /(cloudinary\.com|imgur\.com|i\.pravatar\.cc|res\.cloudinary\.com|images\.unsplash\.com)/i;
        return imageExtensions.test(text) || imageHosts.test(text);
      };

      const formattedMessages = data.map((msg) => {
        const messageText = msg.message || msg.content || "";
        // Check if it's an image: use msg.image flag OR detect from URL
        const msgIsImage = msg.image === true || isImageUrl(messageText);

        return {
          id: msg.id || Date.now(),
          sender: msg.senderId === user?.id ? "me" : "other",
          senderId: msg.senderId,
          senderName: userCache[msg.senderId]?.username || msg.senderName || "User",
          senderAvatar: userCache[msg.senderId]?.avatarUrl || `https://i.pravatar.cc/150?u=${msg.senderId}`,
          senderIsPremium: userCache[msg.senderId]?.isPremium || false,
          text: messageText,
          // Use timestamp field if available (e.g., "16 hours ago"), otherwise format createdAt
          time: msg.timestamp || (msg.createdAt
            ? new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
            : ""),
          isImage: msgIsImage,
        };
      });

      // Reverse to show oldest first (API returns newest first)
      setMessages(formattedMessages.reverse());
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      setMessages([]);
    }
  }, [activeChat, user?.id, userCache]);

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
          isImage: data.isImage || false,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, newMsg]);
      }
    });

    // Receive group message
    newSocket.on("receiveGroupMessage", async (data) => {
      console.log("📨 Received group message:", data);

      // Add message to current chat if it matches
      // Skip if sender is current user (already added locally when sending)
      if (activeChat?.groupId === data.groupId && data.senderId !== user.id) {
        // Get sender info from cache or fetch
        let senderInfo = userCache[data.senderId];
        if (!senderInfo) {
          try {
            const userRes = await userApi.getUserById(data.senderId);
            const userData = userRes?.data?.result;
            const isPremium = Boolean(
              userData?.isPremium ||
              userData?.premiumOneMonth ||
              userData?.premiumSixMonths
            );
            senderInfo = {
              username: userData?.username || userData?.fullName || "User",
              avatarUrl: userData?.avatarUrl || `https://i.pravatar.cc/150?u=${data.senderId}`,
              isPremium: isPremium,
            };
            // Update cache
            setUserCache((prev) => ({ ...prev, [data.senderId]: senderInfo }));
          } catch (err) {
            console.warn(`Failed to fetch user ${data.senderId}:`, err);
            senderInfo = {
              username: "User",
              avatarUrl: `https://i.pravatar.cc/150?u=${data.senderId}`,
              isPremium: false,
            };
          }
        }

        const newMsg = {
          id: Date.now(),
          sender: "other",
          senderId: data.senderId,
          senderName: senderInfo.username,
          senderAvatar: senderInfo.avatarUrl,
          senderIsPremium: senderInfo.isPremium || false,
          text: data.message,
          isImage: data.isImage || false,
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
      if (activeChat.isGroup) {
        fetchGroupMembers(activeChat.groupId);
        // Fetch pending requests if user is admin
        if (activeChat.adminId === user?.id) {
          fetchPendingRequests(activeChat.groupId);
        }
      }
    }
  }, [activeChat, fetchMessages, fetchGroupMembers, fetchPendingRequests, user?.id]);

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

  // Handle send image
  const handleSendImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !socketRef.current || !socketConnected || !activeChat) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file ảnh!");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.");
      return;
    }

    setUploadingImage(true);

    try {
      // Upload image to external service
      const uploadResult = await communicationApi.uploadChatImage(file);
      console.log("📤 Image uploaded:", uploadResult);

      // Get image URL from response
      // Response format: { code: 1000, message: "Upload successful", result: { image: "url" } }
      const imageUrl = uploadResult.result?.image || uploadResult.image || uploadResult.url;

      if (!imageUrl || typeof imageUrl !== 'string') {
        console.error("Invalid upload response:", uploadResult);
        throw new Error("Không lấy được URL ảnh");
      }

      // Send message with image
      if (activeChat.isGroup) {
        const messageData = {
          senderId: user.id,
          groupId: activeChat.groupId,
          message: imageUrl,
          isImage: true,
        };
        socketRef.current.emit("sendMessageToGroup", messageData);
        console.log("📤 Sent group image:", messageData);
      } else {
        const messageData = {
          senderId: user.id,
          receiverId: activeChat.userId,
          message: imageUrl,
          isImage: true,
        };
        socketRef.current.emit("sendMessage", messageData);
        console.log("📤 Sent image:", messageData);
      }

      // Add to local messages immediately
      const newMessage = {
        id: Date.now(),
        sender: "me",
        text: imageUrl,
        isImage: true,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, newMessage]);

    } catch (error) {
      console.error("Failed to send image:", error);
      alert("Không thể gửi ảnh. Vui lòng thử lại!");
    } finally {
      setUploadingImage(false);
      // Reset input
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
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

  // ========== GROUP MANAGEMENT FUNCTIONS ==========

  // Ref for hidden file input
  const avatarInputRef = useRef(null);

  // Upload group avatar (admin only)
  const handleUploadGroupAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !activeChat?.groupId) return;

    setLoadingAction(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      await communicationApi.uploadGroupAvatar(activeChat.groupId, formData);
      alert("Đã cập nhật ảnh đại diện nhóm!");

      // Refresh groups to get new avatar
      fetchGroups();

      // Update active chat avatar - refetch group detail
      const detailRes = await communicationApi.getGroupDetail(activeChat.groupId);
      const groupData = detailRes?.data?.result;
      if (groupData?.image) {
        setActiveChat((prev) => ({ ...prev, avatar: groupData.image }));
      }
    } catch (error) {
      console.error("Failed to upload group avatar:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Không thể tải ảnh lên. Vui lòng thử lại!";
      alert(errorMsg);
    } finally {
      setLoadingAction(false);
      // Reset input
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

  // Request to join a group
  const handleRequestJoinGroup = async (groupId) => {
    setLoadingAction(true);
    try {
      await communicationApi.requestJoinGroup(groupId);
      alert("Đã gửi yêu cầu tham gia nhóm!");
      fetchGroups();
    } catch (error) {
      console.error("Failed to request join group:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Không thể gửi yêu cầu. Vui lòng thử lại!";
      alert(errorMsg);
    } finally {
      setLoadingAction(false);
    }
  };

  // Leave group
  const handleLeaveGroup = async () => {
    if (!activeChat?.groupId) return;

    if (!window.confirm("Bạn có chắc chắn muốn rời khỏi nhóm này?")) return;

    setLoadingAction(true);
    try {
      await communicationApi.leaveGroup(activeChat.groupId);
      alert("Đã rời khỏi nhóm!");
      setShowGroupInfo(false);
      setActiveChat(null);
      fetchGroups();
    } catch (error) {
      console.error("Failed to leave group:", error);
      const errorMsg =
        error.response?.data?.message || "Không thể rời nhóm. Vui lòng thử lại!";
      alert(errorMsg);
    } finally {
      setLoadingAction(false);
    }
  };

  // Remove member (admin only)
  const handleRemoveMember = async (memberId, memberName) => {
    if (!activeChat?.groupId) return;

    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${memberName} khỏi nhóm?`))
      return;

    setLoadingAction(true);
    try {
      await communicationApi.removeMember(activeChat.groupId, memberId);
      alert(`Đã xóa ${memberName} khỏi nhóm!`);
      fetchGroupMembers(activeChat.groupId);
      fetchGroups();
    } catch (error) {
      console.error("Failed to remove member:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Không thể xóa thành viên. Vui lòng thử lại!";
      alert(errorMsg);
    } finally {
      setLoadingAction(false);
    }
  };

  // Accept/Deny join request (admin only)
  const handleModifyRequest = async (requestId, accept) => {
    if (!activeChat?.groupId) return;

    setLoadingAction(true);
    try {
      await communicationApi.modifyRequestStatus(
        requestId,
        activeChat.groupId,
        accept
      );
      alert(accept ? "Đã chấp nhận yêu cầu!" : "Đã từ chối yêu cầu!");
      // Refresh pending requests and members
      fetchPendingRequests(activeChat.groupId);
      fetchGroupMembers(activeChat.groupId);
      fetchGroups();
    } catch (error) {
      console.error("Failed to modify request:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Không thể xử lý yêu cầu. Vui lòng thử lại!";
      alert(errorMsg);
    } finally {
      setLoadingAction(false);
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

  const isCurrentUserAdmin = activeChat?.isGroup && activeChat?.adminId === user?.id;
  const isCurrentUserMember = activeChat?.isGroup && activeChat?.isMember;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden rounded-3xl border border-gray-200 shadow-sm">
      <div className="flex w-80 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-800">Đoạn chat</h1>
              <div
                className={`h-2 w-2 rounded-full ${socketConnected ? "bg-green-500" : "bg-red-500"
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
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${activeTab === "direct"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
              Trực tiếp
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("groups")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${activeTab === "groups"
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
                  className={`mx-2 mb-2 flex items-center gap-3 rounded-xl p-3 text-left transition-colors ${activeChat.id === chat.id
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
                        className={`truncate text-sm font-semibold ${activeChat.id === chat.id
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
                        className={`max-w-[140px] truncate text-xs ${chat.unread
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
                  onClick={() => {
                    setActiveChat(group);
                    setShowGroupInfo(false);
                  }}
                  className={`mx-2 mb-2 flex items-center gap-3 rounded-xl p-3 text-left transition-colors w-[calc(100%-1rem)] ${activeChat?.id === group.id
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
                    <div className="flex items-center gap-2">
                      <h3
                        className={`truncate text-sm font-semibold ${activeChat?.id === group.id
                          ? "text-blue-700"
                          : "text-gray-900"
                          }`}
                      >
                        {group.name}
                      </h3>
                      {group.isAdmin && (
                        <Crown className="h-3.5 w-3.5 text-yellow-500" />
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {group.memberCount} thành viên
                      </p>
                      {!group.isMember && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestJoinGroup(group.groupId);
                          }}
                          disabled={loadingAction}
                          className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                          <UserPlus className="h-3 w-3" />
                          Tham gia
                        </button>
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
          <button
            type="button"
            onClick={() => activeChat.isGroup && setShowGroupInfo(!showGroupInfo)}
            className={`flex items-center gap-3 ${activeChat.isGroup ? "cursor-pointer hover:bg-gray-50 -ml-2 pl-2 pr-3 py-1 rounded-lg" : ""}`}
          >
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
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">
                  {activeChat.name}
                </p>
                {activeChat.isGroup && isCurrentUserAdmin && (
                  <Shield className="h-4 w-4 text-yellow-500" />
                )}
              </div>
              <p className="text-xs text-gray-500">
                {activeChat.isGroup
                  ? `${activeChat.memberCount} thành viên`
                  : activeChat.isOnline
                    ? "Đang hoạt động"
                    : "Hoạt động gần đây"}
              </p>
            </div>
            {activeChat.isGroup && (
              <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${showGroupInfo ? "rotate-90" : ""}`} />
            )}
          </button>
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

        <div className="flex flex-1 overflow-hidden">
          {/* Messages Area */}
          <div className={`flex-1 flex flex-col ${showGroupInfo ? "border-r border-gray-100" : ""}`}>
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
                    className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"
                      }`}
                  >
                    {message.sender === "other" && (
                      <button
                        type="button"
                        onClick={() => {
                          const targetUserId = activeChat.isGroup ? message.senderId : activeChat.userId;
                          if (targetUserId) navigate(`/user/${targetUserId}`);
                        }}
                        className="mr-2 self-end focus:outline-none rounded-full transition-transform hover:scale-110 relative group/avatar"
                        title={`Xem profile ${activeChat.isGroup ? message.senderName : activeChat.name}`}
                      >
                        {/* Premium Avatar Frame */}
                        {activeChat.isGroup && message.senderIsPremium && (
                          <div
                            className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-full animate-spin opacity-75 group-hover/avatar:opacity-100 transition-opacity"
                            style={{ animationDuration: "3s" }}
                          />
                        )}
                        <div
                          className={`relative ${activeChat.isGroup && message.senderIsPremium
                            ? "p-0.5 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-full"
                            : ""
                            }`}
                        >
                          <img
                            src={activeChat.isGroup ? (message.senderAvatar || `https://i.pravatar.cc/150?u=${message.senderId}`) : activeChat.avatar}
                            alt={activeChat.isGroup ? message.senderName : activeChat.name}
                            className={`h-8 w-8 rounded-full object-cover cursor-pointer ${activeChat.isGroup && message.senderIsPremium ? "ring-1 ring-white" : ""
                              }`}
                          />
                        </div>
                        {/* Premium Crown Badge */}
                        {activeChat.isGroup && message.senderIsPremium && (
                          <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-0.5 shadow-lg">
                            <Crown className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </button>
                    )}
                    <div
                      className={`group relative max-w-[70%] rounded-2xl px-4 py-2 text-sm ${message.sender === "me"
                        ? "rounded-br-none bg-blue-600 text-white"
                        : "rounded-bl-none bg-gray-100 text-gray-800"
                        }`}
                    >
                      {activeChat.isGroup && message.sender === "other" && (
                        <p className={`text-xs font-semibold mb-1 ${message.senderIsPremium
                          ? "bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 bg-clip-text text-transparent"
                          : "text-blue-600"
                          }`}>
                          {message.senderName}
                          {message.senderIsPremium && " ✨"}
                        </p>
                      )}
                      {/* Display image or text */}
                      {message.isImage ? (
                        <img
                          src={message.text}
                          alt="Sent image"
                          className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(message.text, "_blank")}
                          loading="lazy"
                        />
                      ) : (
                        message.text
                      )}
                      <span
                        className={`pointer-events-none absolute bottom-full mb-1 text-[10px] text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 ${message.sender === "me" ? "right-0" : "left-0"
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
              {/* Hidden file input for images */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleSendImage}
                className="hidden"
                id="chat-image-upload"
              />

              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage || !socketConnected}
                  className="rounded-full p-2 text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Gửi ảnh"
                >
                  {uploadingImage ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Image className="h-6 w-6" />
                  )}
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

          {/* Group Info Panel */}
          {showGroupInfo && activeChat.isGroup && (
            <div className="w-72 bg-gray-50 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Thông tin nhóm</h3>
                <button
                  type="button"
                  onClick={() => setShowGroupInfo(false)}
                  className="p-1 rounded-full hover:bg-gray-200"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>

              {/* Group Avatar & Name */}
              <div className="flex flex-col items-center mb-6">
                {/* Hidden file input */}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadGroupAvatar}
                  className="hidden"
                  id="group-avatar-upload"
                />

                {/* Avatar with upload overlay for admin */}
                <div className="relative group/avatar mb-3">
                  <img
                    src={activeChat.avatar}
                    alt={activeChat.name}
                    className={`h-20 w-20 rounded-full object-cover ${isCurrentUserAdmin ? "cursor-pointer" : ""
                      }`}
                    onClick={() => {
                      if (isCurrentUserAdmin && avatarInputRef.current) {
                        avatarInputRef.current.click();
                      }
                    }}
                  />
                  {/* Upload overlay for admin */}
                  {isCurrentUserAdmin && (
                    <div
                      className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => {
                        if (avatarInputRef.current) {
                          avatarInputRef.current.click();
                        }
                      }}
                    >
                      {loadingAction ? (
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      ) : (
                        <Camera className="h-6 w-6 text-white" />
                      )}
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-gray-900 text-lg">{activeChat.name}</h4>
                <p className="text-sm text-gray-500">{activeChat.memberCount} thành viên</p>
                {isCurrentUserAdmin && (
                  <p className="text-xs text-blue-500 mt-1">Click vào ảnh để thay đổi</p>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2 mb-6">
                {isCurrentUserAdmin && (
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="h-4 w-4" />
                    Cài đặt nhóm
                  </button>
                )}

                {isCurrentUserMember && !isCurrentUserAdmin && (
                  <button
                    type="button"
                    onClick={handleLeaveGroup}
                    disabled={loadingAction}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Rời nhóm
                  </button>
                )}

                {isCurrentUserAdmin && (
                  <p className="text-xs text-gray-400 text-center px-2">
                    Admin không thể rời nhóm. Hãy xóa nhóm nếu cần.
                  </p>
                )}
              </div>

              {/* Members List */}
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-3">
                  Thành viên ({groupMembers.length || activeChat.memberCount})
                </h5>
                <div className="space-y-2">
                  {groupMembers.length > 0 ? (
                    groupMembers.map((member) => (
                      <div
                        key={member.userId || member.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white"
                      >
                        <img
                          src={member.avatarUrl || `https://i.pravatar.cc/150?u=${member.userId}`}
                          alt={member.username}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {member.username || "User"}
                            </p>
                            {(member.userId === activeChat.adminId || member.id === activeChat.adminId) && (
                              <Crown className="h-3.5 w-3.5 text-yellow-500" />
                            )}
                          </div>
                        </div>
                        {isCurrentUserAdmin &&
                          member.userId !== user.id &&
                          member.userId !== activeChat.adminId && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveMember(member.userId, member.username)
                              }
                              disabled={loadingAction}
                              className="p-1.5 rounded-full text-red-500 hover:bg-red-50 disabled:opacity-50"
                              title="Xóa thành viên"
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-2">
                      Đang tải thành viên...
                    </p>
                  )}
                </div>
              </div>

              {/* Pending Requests (Admin Only) */}
              {isCurrentUserAdmin && pendingRequests.length > 0 && (
                <div className="mt-6">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3">
                    Yêu cầu chờ duyệt ({pendingRequests.length})
                  </h5>
                  <div className="space-y-2">
                    {pendingRequests.map((request) => (
                      <div
                        key={request.userId}
                        className="flex items-center gap-3 p-2 rounded-lg bg-yellow-50 border border-yellow-200"
                      >
                        <img
                          src={request.avatarUrl || `https://i.pravatar.cc/150?u=${request.userId}`}
                          alt={request.username}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {request.username}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleModifyRequest(request.userId, true)}
                            disabled={loadingAction}
                            className="p-1.5 rounded-full text-green-600 hover:bg-green-100 disabled:opacity-50"
                            title="Chấp nhận"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleModifyRequest(request.userId, false)}
                            disabled={loadingAction}
                            className="p-1.5 rounded-full text-red-500 hover:bg-red-100 disabled:opacity-50"
                            title="Từ chối"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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

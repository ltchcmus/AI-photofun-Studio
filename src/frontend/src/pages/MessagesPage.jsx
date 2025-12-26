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
  Trash2,
} from "lucide-react";
import io from "socket.io-client";
import { useAuth } from "../hooks/useAuth";
import { communicationApi } from "../api/communicationApi";
import { userApi } from "../api/userApi";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import VideoCallModal from "../components/common/VideoCallModal";
import IncomingCallModal from "../components/common/IncomingCallModal";
import { stopCall } from "../api/call-video";

// For ngrok: use backend ngrok URL directly
// For localhost: use window.location.origin with Vite proxy
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
const DEFAULT_GROUP_AVATAR = "https://res.cloudinary.com/derwtva4p/image/upload/v1765458810/file-service/fffsss.png";

const MessagesPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Share to group from AI tools
  const shareToGroup = location.state?.shareToGroup;

  // State
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]); // My groups (joined)
  const [exploreGroups, setExploreGroups] = useState([]); // All groups (for explore)
  const [activeTab, setActiveTab] = useState(shareToGroup ? "groups" : "direct"); // Auto switch to groups if sharing
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [pendingShareMedia, setPendingShareMedia] = useState(shareToGroup || null); // Media waiting to be sent

  // Group Management State
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [userCache, setUserCache] = useState({}); // Cache user info { odId: { username, avatarUrl } }
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Edit Group State (Admin Only)
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDescription, setEditGroupDescription] = useState("");

  // Video/Audio Call State
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [isAudioOnlyCall, setIsAudioOnlyCall] = useState(false);
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [callStatus, setCallStatus] = useState(null); // 'waiting', 'connecting', 'connected'
  const [currentCallId, setCurrentCallId] = useState(null);
  const [isCaller, setIsCaller] = useState(false); // true if this user initiated the call
  const [callRecipientId, setCallRecipientId] = useState(null); // ID of the other user in call

  // Refs
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

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

  // Fetch all groups for Explore (filter out joined groups)
  const fetchExploreGroups = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await communicationApi.getAllGroups(1, 50);
      const data = response?.data?.result?.items || [];

      const formattedGroups = data.map((group) => {
        const memberIds = group.memberIds || [];
        const isMember = memberIds.includes(user.id) || group.adminId === user.id;

        return {
          id: group.groupId,
          groupId: group.groupId,
          name: group.name || "Nhóm",
          description: group.description || "",
          avatar: group.image || DEFAULT_GROUP_AVATAR,
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
      }).filter(group => !group.isMember); // Filter out groups user has joined

      setExploreGroups(formattedGroups);
      console.log("✅ Fetched explore groups:", formattedGroups);
    } catch (error) {
      console.error("Failed to fetch explore groups:", error);
    }
  }, [user?.id]);

  // Fetch my groups (joined groups)
  const fetchMyGroups = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await userApi.getMyGroups(1, 50);
      console.log("📋 getMyGroups raw response:", response?.data);

      // get-group-joined returns list of groupId strings or objects with groupId
      let groupIds = [];
      const result = response?.data?.result;

      if (Array.isArray(result?.items)) {
        // Format: { result: { items: [{groupId: "..."}, ...] } }
        groupIds = result.items.map(item => typeof item === 'string' ? item : item.groupId);
      } else if (Array.isArray(result)) {
        // Format: { result: ["groupId1", "groupId2", ...] } or [{groupId: "..."}, ...]
        groupIds = result.map(item => typeof item === 'string' ? item : item.groupId);
      }

      console.log("📋 Group IDs to fetch:", groupIds);

      if (groupIds.length === 0) {
        setGroups([]);
        return;
      }

      // Fetch details for each group using getGroupDetail
      const groupDetailsPromises = groupIds.map(async (groupId) => {
        try {
          const detailRes = await communicationApi.getGroupDetail(groupId);
          return detailRes?.data?.result || null;
        } catch (err) {
          console.error(`Failed to fetch group ${groupId}:`, err);
          return null;
        }
      });

      const groupDetails = await Promise.all(groupDetailsPromises);
      console.log("📋 Group details:", groupDetails);

      const formattedGroups = groupDetails
        .filter(group => group !== null)
        .map((group, index) => {
          const memberIds = group.memberIds || [];

          return {
            id: group.groupId || group.id,
            groupId: group.groupId || group.id,
            name: group.name || `Nhóm ${index + 1}`,
            description: group.description || "",
            avatar: group.image || DEFAULT_GROUP_AVATAR,
            lastMessage: "",
            time: "",
            unread: 0,
            memberCount: memberIds.length || group.memberCount || 0,
            isGroup: true,
            adminId: group.adminId,
            memberIds: memberIds,
            isMember: true, // User has joined
            isAdmin: group.adminId === user.id,
          };
        });

      setGroups(formattedGroups);
      console.log("✅ Fetched my groups:", formattedGroups);
    } catch (error) {
      console.error("Failed to fetch my groups:", error);
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

      // Fetch user info for each request
      const requestsWithUserInfo = await Promise.all(
        groupRequests.map(async (req) => {
          // Check cache first
          if (userCache[req.userId]) {
            return {
              ...req,
              username: userCache[req.userId].username,
              avatarUrl: userCache[req.userId].avatarUrl,
            };
          }

          // Fetch user info
          try {
            const userRes = await userApi.getUserById(req.userId);
            const userData = userRes?.data?.result;
            const username = userData?.username || userData?.fullName || "User";
            const avatarUrl = userData?.avatarUrl || `https://i.pravatar.cc/150?u=${req.userId}`;

            // Update cache
            setUserCache((prev) => ({
              ...prev,
              [req.userId]: { username, avatarUrl },
            }));

            return {
              ...req,
              username,
              avatarUrl,
            };
          } catch (err) {
            console.error(`Failed to fetch user ${req.userId}:`, err);
            return {
              ...req,
              username: "User",
              avatarUrl: `https://i.pravatar.cc/150?u=${req.userId}`,
            };
          }
        })
      );

      setPendingRequests(requestsWithUserInfo);
      console.log("✅ Fetched pending requests with user info:", requestsWithUserInfo);
    } catch (error) {
      console.error("Failed to fetch pending requests:", error);
      setPendingRequests([]);
    }
  }, [userCache]);

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
        // Fetch 1-1 messages
        // Response format: { result: { items: [{ userId, message, timestamp, image }, ...] } }
        if (!activeChat.userId) return;
        response = await communicationApi.getMessages(activeChat.userId, 1, 50);
        console.log("📨 1-1 messages response:", response?.data);
        data = response?.data?.result?.items || response?.data?.result?.data || response?.data?.result || [];
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

      // Helper function to detect if a message is a video URL
      const isVideoUrl = (text) => {
        if (!text || typeof text !== 'string') return false;
        // Check common video extensions
        const videoExtensions = /\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i;
        // Check cloudinary video URLs
        const isCloudinaryVideo = text.includes('cloudinary.com') && text.includes('/video/');
        return videoExtensions.test(text) || isCloudinaryVideo;
      };

      const formattedMessages = data.map((msg) => {
        const messageText = msg.message || msg.content || "";
        // Check if it's a video: use msg.video flag OR detect from URL
        const msgIsVideo = msg.video === true || isVideoUrl(messageText);
        // Check if it's an image: use msg.image flag OR detect from URL (but not if it's a video)
        const msgIsImage = !msgIsVideo && (msg.image === true || isImageUrl(messageText));

        // Support both senderId (group) and userId (1-1) fields
        const messageSenderId = msg.senderId || msg.userId;

        return {
          id: msg.id || Date.now() + Math.random(),
          sender: messageSenderId === user?.id ? "me" : "other",
          senderId: messageSenderId,
          senderName: userCache[messageSenderId]?.username || msg.senderName || "User",
          senderAvatar: userCache[messageSenderId]?.avatarUrl || `https://i.pravatar.cc/150?u=${messageSenderId}`,
          senderIsPremium: userCache[messageSenderId]?.isPremium || false,
          text: messageText,
          // Use timestamp field if available (e.g., "16 hours ago"), otherwise format createdAt
          time: msg.timestamp || (msg.createdAt
            ? new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
            : ""),
          isImage: msgIsImage,
          isVideo: msgIsVideo,
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
      reconnectionDelay: 5000,
      reconnection: true,
      reconnectionAttempts: 3,
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
      console.warn("⚠️ Socket connection failed (backend may be offline):", error.message);
      setSocketConnected(false);
      // Don't spam reconnection attempts if backend is down
      if (error.message.includes("ECONNREFUSED")) {
        console.log("💡 Backend socket server not running. Chat features limited.");
      }
    });

    newSocket.on("reconnect_failed", () => {
      console.warn("⚠️ Failed to reconnect to socket after multiple attempts");
      setSocketConnected(false);
    });

    // Receive 1-1 message
    newSocket.on("receiveMessage", (data) => {
      console.log("📨 Received 1-1 message:", data);

      // Helper function to detect if a message is an image URL
      const isImageUrl = (text) => {
        if (!text || typeof text !== 'string') return false;
        const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i;
        const imageHosts = /(cloudinary\.com|imgur\.com|i\.pravatar\.cc|res\.cloudinary\.com|images\.unsplash\.com)/i;
        return imageExtensions.test(text) || imageHosts.test(text);
      };

      // Helper function to detect if a message is a video URL
      const isVideoUrl = (text) => {
        if (!text || typeof text !== 'string') return false;
        const videoExtensions = /\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i;
        return videoExtensions.test(text) || (text.includes('cloudinary.com') && text.includes('/video/'));
      };

      // Check if it's an image or video
      const msgIsVideo = data.isVideo === true || isVideoUrl(data.message);
      const msgIsImage = !msgIsVideo && (data.isImage === true || data.image === true || isImageUrl(data.message));

      // Add message to current chat if it matches
      if (activeChat?.userId === data.senderId) {
        const newMsg = {
          id: Date.now(),
          sender: "other",
          text: data.message,
          isImage: msgIsImage,
          isVideo: msgIsVideo,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, newMsg]);
      }
    });

    // Receive incoming call
    newSocket.on("incomingCall", async (data) => {
      console.log("📞 Incoming call from:", data);

      // Get caller info
      try {
        const userRes = await userApi.getUserById(data.callerId);
        const userData = userRes?.data?.result;

        setIncomingCallData({
          callerId: data.callerId,
          callerName: userData?.username || userData?.fullName || "Người dùng",
          callerAvatar: userData?.avatarUrl || `https://i.pravatar.cc/150?u=${data.callerId}`,
          isVideoCall: data.isVideoCall,
          callId: data.callId,
        });
        setShowIncomingCall(true);
      } catch (error) {
        console.error("Failed to fetch caller info:", error);
      }
    });

    // Call accepted by receiver
    newSocket.on("callAccepted", (data) => {
      console.log("✅ Call accepted:", data);
      // Change status from 'waiting' to 'connecting' to trigger WebRTC setup
      setCallStatus('connecting');
    });

    // Call rejected by receiver
    newSocket.on("callRejected", (data) => {
      console.log("❌ Call rejected:", data);
      alert(`${data.receiverName || "Người dùng"} đã từ chối cuộc gọi`);
      setShowVideoCall(false);
      setCallStatus(null);
      setCurrentCallId(null);
      setIsCaller(false);
      setCallRecipientId(null);
      stopCall();
    });

    // Call ended by other user
    newSocket.on("callEnded", (data) => {
      console.log("📞 Call ended by other user:", data);
      setShowVideoCall(false);
      setShowIncomingCall(false);
      setCallStatus(null);
      setCurrentCallId(null);
      setIsCaller(false);
      setCallRecipientId(null);
      // Stop WebRTC when call ended
      stopCall();
    });

    // Receive group message
    newSocket.on("receiveGroupMessage", async (data) => {
      console.log("📨 Received group message:", data);

      // Helper function to detect if a message is an image URL
      const isImageUrl = (text) => {
        if (!text || typeof text !== 'string') return false;
        const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i;
        const imageHosts = /(cloudinary\.com|imgur\.com|i\.pravatar\.cc|res\.cloudinary\.com|images\.unsplash\.com)/i;
        return imageExtensions.test(text) || imageHosts.test(text);
      };

      // Helper function to detect if a message is a video URL
      const isVideoUrl = (text) => {
        if (!text || typeof text !== 'string') return false;
        const videoExtensions = /\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i;
        return videoExtensions.test(text) || (text.includes('cloudinary.com') && text.includes('/video/'));
      };

      // Check if it's an image or video
      const msgIsVideo = data.isVideo === true || isVideoUrl(data.message);
      const msgIsImage = !msgIsVideo && (data.isImage === true || data.image === true || isImageUrl(data.message));

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
          isImage: msgIsImage,
          isVideo: msgIsVideo,
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

  // Fetch groups when switching to groups or explore tab
  useEffect(() => {
    if (activeTab === "groups") {
      fetchMyGroups();
    } else if (activeTab === "explore") {
      fetchExploreGroups();
    }
  }, [activeTab, fetchMyGroups, fetchExploreGroups]);

  // Auto-select conversation based on URL param or first conversation
  useEffect(() => {
    const userIdFromUrl = searchParams.get("userId");

    // If we have a userId from URL, try to find and select that conversation
    if (userIdFromUrl) {
      const targetConversation = conversations.find(
        (conv) => conv.userId === userIdFromUrl
      );

      if (targetConversation) {
        setActiveChat(targetConversation);
        console.log("✅ Auto-selected conversation from URL:", userIdFromUrl);
        // Clear the URL param after selecting
        navigate("/messages", { replace: true });
      } else if (conversations.length > 0) {
        // Conversation not found but we have conversations loaded
        // Try to add conversation and refetch
        const addAndFetch = async () => {
          try {
            console.log("🔄 Conversation not found, trying to add and refetch...");
            await communicationApi.addConversation(userIdFromUrl);
            await fetchConversations();
          } catch (error) {
            console.log("Conversation may already exist, refetching...");
            await fetchConversations();
          }
        };
        addAndFetch();
      }
    } else if (!activeChat && conversations.length > 0) {
      // No URL param, select first conversation
      setActiveChat(conversations[0]);
    }
  }, [conversations, searchParams, activeChat, navigate, fetchConversations]);

  // Scroll to bottom when new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle share to group from AI tools
  const hasSentShareRef = useRef(false);

  useEffect(() => {
    if (!pendingShareMedia || !groups.length || !socketRef.current || !socketConnected) return;
    if (hasSentShareRef.current) return; // Prevent duplicate sends

    const targetGroup = groups.find(g => g.groupId === pendingShareMedia.groupId);
    if (targetGroup) {
      hasSentShareRef.current = true; // Mark as sent

      // Select the target group
      setActiveChat(targetGroup);
      setActiveTab("groups");

      // Wait a bit for chat to be selected then send the media
      const sendMedia = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));

        const messageData = {
          senderId: user.id,
          groupId: pendingShareMedia.groupId,
          message: pendingShareMedia.mediaUrl,
          isImage: !pendingShareMedia.isVideo,
          isVideo: pendingShareMedia.isVideo,
        };

        socketRef.current.emit("sendMessageToGroup", messageData);
        console.log("📤 Sent shared media to group:", messageData);

        // Add to local messages
        const newMsg = {
          id: Date.now(),
          sender: "me",
          text: pendingShareMedia.mediaUrl,
          isImage: !pendingShareMedia.isVideo,
          isVideo: pendingShareMedia.isVideo,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages(prev => [...prev, newMsg]);

        // Clear pending and location state
        setPendingShareMedia(null);
        navigate("/messages", { replace: true, state: {} });

        // Reset the ref after a delay
        setTimeout(() => {
          hasSentShareRef.current = false;
        }, 1000);
      };

      sendMedia();
    }
  }, [pendingShareMedia, groups, socketConnected, user?.id, navigate]);

  // Handle video call
  const handleStartVideoCall = () => {
    if (!activeChat || activeChat.isGroup) {
      alert("Chỉ có thể gọi video trong chat 1-1!");
      return;
    }

    if (!socketRef.current || !socketConnected) {
      alert("Không thể kết nối! Vui lòng thử lại sau.");
      return;
    }

    // Emit call event to receiver
    const callData = {
      callerId: user.id,
      receiverId: activeChat.userId,
      isVideoCall: true,
      callId: Date.now().toString(),
    };

    socketRef.current.emit("callUser", callData);
    console.log("📞 Initiating video call:", callData);

    setIsAudioOnlyCall(false);
    setCallStatus('waiting'); // Set to waiting for receiver to accept
    setCurrentCallId(callData.callId);
    setIsCaller(true); // This user is the caller
    setCallRecipientId(activeChat.userId);
    setShowVideoCall(true);
  };

  // Handle audio call
  const handleStartAudioCall = () => {
    if (!activeChat || activeChat.isGroup) {
      alert("Chỉ có thể gọi audio trong chat 1-1!");
      return;
    }

    if (!socketRef.current || !socketConnected) {
      alert("Không thể kết nối! Vui lòng thử lại sau.");
      return;
    }

    // Emit call event to receiver
    const callData = {
      callerId: user.id,
      receiverId: activeChat.userId,
      isVideoCall: false,
      callId: Date.now().toString(),
    };

    socketRef.current.emit("callUser", callData);
    console.log("📞 Initiating audio call:", callData);

    setIsAudioOnlyCall(true);
    setCallStatus('waiting'); // Set to waiting for receiver to accept
    setCurrentCallId(callData.callId);
    setIsCaller(true); // This user is the caller
    setCallRecipientId(activeChat.userId);
    setShowVideoCall(true);
  };

  // Handle accept incoming call
  const handleAcceptCall = () => {
    if (!incomingCallData || !socketRef.current) return;

    // Emit accept event
    socketRef.current.emit("answerCall", {
      callerId: incomingCallData.callerId,
      receiverId: user.id,
      callId: incomingCallData.callId,
      isVideoCall: incomingCallData.isVideoCall,
    });

    console.log("✅ Accepting call from:", incomingCallData.callerId);

    // Show call modal with connecting status (receiver starts WebRTC immediately)
    setIsAudioOnlyCall(!incomingCallData.isVideoCall);
    setCallStatus('connecting'); // Receiver goes directly to connecting
    setCurrentCallId(incomingCallData.callId);
    setIsCaller(false); // This user is the receiver, not the caller
    setCallRecipientId(incomingCallData.callerId); // The other user in call is the caller
    setShowVideoCall(true);
    setShowIncomingCall(false);

    // Set active chat to caller
    const callerConversation = conversations.find(
      (conv) => conv.userId === incomingCallData.callerId
    );
    if (callerConversation) {
      setActiveChat(callerConversation);
    }
  };

  // Handle reject incoming call
  const handleRejectCall = () => {
    if (!incomingCallData || !socketRef.current) return;

    // Emit reject event
    socketRef.current.emit("rejectCall", {
      callerId: incomingCallData.callerId,
      receiverId: user.id,
      callId: incomingCallData.callId,
    });



    setShowIncomingCall(false);
    setIncomingCallData(null);
  };

  // Handle end call
  const handleEndCall = () => {
    // Emit end call event to notify other user
    if (socketRef.current && callRecipientId) {
      socketRef.current.emit("endCall", {
        userId: user.id,
        otherUserId: callRecipientId,
      });
      console.log("📞 Ending call, notifying:", callRecipientId);
    }

    // Reset all call state
    setShowVideoCall(false);
    setCallStatus(null);
    setCurrentCallId(null);
    setIsCaller(false);
    setCallRecipientId(null);
  };

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
      } else {
        const messageData = {
          senderId: user.id,
          receiverId: activeChat.userId,
          message: imageUrl,
          isImage: true,
        };
        socketRef.current.emit("sendMessage", messageData);
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

  // Handle send video
  const handleSendVideo = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !socketRef.current || !socketConnected || !activeChat) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      alert("Vui lòng chọn file video!");
      return;
    }

    // Validate file size (max 50MB for video)
    if (file.size > 50 * 1024 * 1024) {
      alert("Video quá lớn! Vui lòng chọn video dưới 50MB.");
      return;
    }

    setUploadingVideo(true);

    try {
      // Upload video to external service
      const uploadResult = await communicationApi.uploadChatVideo(file);

      // Get video URL from response
      // Response format: { code: 1000, message: "Upload video successful", result: { videoUrl: "url" } }
      const videoUrl = uploadResult.result?.videoUrl || uploadResult.videoUrl || uploadResult.url;

      if (!videoUrl || typeof videoUrl !== 'string') {
        console.error("Invalid upload response:", uploadResult);
        throw new Error("Không lấy được URL video");
      }

      // Send message with video
      if (activeChat.isGroup) {
        const messageData = {
          senderId: user.id,
          groupId: activeChat.groupId,
          message: videoUrl,
          isImage: false,
          isVideo: true,
        };
        socketRef.current.emit("sendMessageToGroup", messageData);
      } else {
        const messageData = {
          senderId: user.id,
          receiverId: activeChat.userId,
          message: videoUrl,
          isImage: false,
          isVideo: true,
        };
        socketRef.current.emit("sendMessage", messageData);
      }

      // Add to local messages immediately
      const newMessage = {
        id: Date.now(),
        sender: "me",
        text: videoUrl,
        isVideo: true,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, newMessage]);

    } catch (error) {
      console.error("Failed to send video:", error);
      alert("Không thể gửi video. Vui lòng thử lại!");
    } finally {
      setUploadingVideo(false);
      // Reset input
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      const response = await communicationApi.createGroup(newGroupName);

      alert(`Tạo nhóm "${newGroupName}" thành công!`);
      setShowCreateGroup(false);
      setNewGroupName("");

      // Refresh groups lists
      fetchMyGroups();
      fetchExploreGroups();
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
      fetchMyGroups();

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

  // Update group info (Admin Only)
  const handleUpdateGroup = async () => {
    if (!activeChat?.groupId || !editGroupName.trim()) return;

    setLoadingAction(true);
    try {
      await communicationApi.updateGroup(activeChat.groupId, {
        name: editGroupName.trim(),
        description: editGroupDescription.trim(),
      });

      alert("Đã cập nhật thông tin nhóm!");

      // Update local state
      setActiveChat((prev) => ({
        ...prev,
        name: editGroupName.trim(),
        description: editGroupDescription.trim(),
      }));

      // Refresh groups
      fetchMyGroups();
      fetchExploreGroups();

      // Exit edit mode
      setIsEditingGroup(false);
    } catch (error) {
      console.error("Failed to update group:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Không thể cập nhật nhóm. Vui lòng thử lại!";
      alert(errorMsg);
    } finally {
      setLoadingAction(false);
    }
  };

  // Start editing group
  const startEditGroup = () => {
    setEditGroupName(activeChat?.name || "");
    setEditGroupDescription(activeChat?.description || "");
    setIsEditingGroup(true);
  };

  // Cancel editing group
  const cancelEditGroup = () => {
    setIsEditingGroup(false);
    setEditGroupName("");
    setEditGroupDescription("");
  };

  // Delete conversation (Direct messages)
  const handleDeleteConversation = async (userId, username) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa cuộc hội thoại với "${username}"?\n\nHành động này sẽ xóa tất cả tin nhắn.`)) {
      return;
    }

    setLoadingAction(true);
    try {
      await communicationApi.deleteConversation(userId);
      alert("Đã xóa cuộc hội thoại!");

      // Refresh conversations list
      fetchConversations();

      // Clear active chat if it's the deleted conversation
      if (activeChat?.userId === userId) {
        setActiveChat(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Không thể xóa cuộc hội thoại. Vui lòng thử lại!";
      alert(errorMsg);
    } finally {
      setLoadingAction(false);
    }
  };

  // Request to join a group
  const handleRequestJoinGroup = async (groupId) => {
    setLoadingAction(true);
    try {
      await communicationApi.requestJoinGroup(groupId);
      alert("Đã gửi yêu cầu tham gia nhóm!");
      // Refresh both lists - group moves from explore to my groups after approval
      fetchExploreGroups();
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
      // Refresh both lists - group moves from my groups to explore
      fetchMyGroups();
      fetchExploreGroups();
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
      fetchMyGroups();
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
      fetchMyGroups();
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
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <div className="flex h-[calc(100vh-8rem)] w-full items-center justify-center bg-gray-50 rounded-3xl border border-gray-200">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <Users className="h-16 w-16 text-gray-300" />
            <p className="text-lg font-medium">Chưa có cuộc trò chuyện</p>
            <p className="text-sm text-gray-400">
              Bắt đầu nhắn tin với bạn bè ngay!
            </p>
          </div>
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
    <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
      <div className="flex h-[calc(100vh-8rem)] w-full bg-gray-50 overflow-hidden rounded-3xl border border-gray-200 shadow-sm">
        {/* Offline Warning Banner */}
        {!socketConnected && (
          <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium z-10">
            ⚠️ Chat server offline - Chỉ xem được tin nhắn cũ, không gửi được tin nhắn mới
          </div>
        )}

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
            <div className="flex gap-1 mt-4">
              <button
                type="button"
                onClick={() => setActiveTab("direct")}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${activeTab === "direct"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                Trực tiếp
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("groups")}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${activeTab === "groups"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                Nhóm
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("explore")}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${activeTab === "explore"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                🔍 Khám phá
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === "direct" ? (
              // Direct Messages Tab
              conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mb-3 text-gray-300" />
                  <p className="text-sm">Chưa có cuộc trò chuyện</p>
                </div>
              ) : (
                conversations.map((chat) => (
                  <div
                    key={chat.id}
                    className={`group/conv mx-2 mb-2 flex items-center gap-3 rounded-xl p-3 text-left transition-colors ${activeChat?.id === chat.id
                      ? "bg-blue-50"
                      : "hover:bg-gray-100"
                      }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveChat(chat)}
                      className="flex items-center gap-3 flex-1 min-w-0"
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
                            className={`truncate text-sm font-semibold ${activeChat?.id === chat.id
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
                            className={`max-w-[120px] truncate text-xs ${chat.unread
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
                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(chat.userId, chat.name);
                      }}
                      disabled={loadingAction}
                      className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover/conv:opacity-100 transition-all disabled:opacity-50"
                      title="Xóa cuộc hội thoại"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )
            ) : activeTab === "groups" ? (
              // My Groups Tab (joined groups)
              groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mb-3 text-gray-300" />
                  <p className="text-sm">Chưa tham gia nhóm nào</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("explore")}
                    className="mt-3 text-sm text-purple-600 hover:underline"
                  >
                    🔍 Khám phá nhóm
                  </button>
                  {isPremium && (
                    <button
                      type="button"
                      onClick={() => setShowCreateGroup(true)}
                      className="mt-2 text-sm text-blue-600 hover:underline"
                    >
                      Hoặc tạo nhóm mới
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
                      <p className="text-xs text-gray-500 mt-0.5">
                        {group.memberCount} thành viên
                      </p>
                    </div>
                  </button>
                ))
              )
            ) : (
              // Explore Tab (all groups - not joined)
              exploreGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mb-3 text-gray-300" />
                  <p className="text-sm">Không có nhóm mới để khám phá</p>
                  <p className="text-xs text-gray-400 mt-1">Bạn đã tham gia tất cả nhóm!</p>
                </div>
              ) : (
                exploreGroups.map((group) => (
                  <button
                    type="button"
                    key={group.id}
                    onClick={() => {
                      setActiveChat(group);
                      setShowGroupInfo(false);
                    }}
                    className={`mx-2 mb-2 flex items-center gap-3 rounded-xl p-3 text-left transition-colors w-[calc(100%-1rem)] ${activeChat?.id === group.id
                      ? "bg-purple-50"
                      : "hover:bg-gray-100"
                      }`}
                  >
                    <div className="relative">
                      <img
                        src={group.avatar}
                        alt={group.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <span className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-white border-2 border-white">
                        <Users className="h-2.5 w-2.5" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`truncate text-sm font-semibold ${activeChat?.id === group.id
                            ? "text-purple-700"
                            : "text-gray-900"
                            }`}
                        >
                          {group.name}
                        </h3>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          {group.memberCount} thành viên
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestJoinGroup(group.groupId);
                          }}
                          disabled={loadingAction}
                          className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 disabled:opacity-50"
                        >
                          <UserPlus className="h-3 w-3" />
                          Tham gia
                        </button>
                      </div>
                    </div>
                  </button>
                ))
              )
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
                onClick={handleStartAudioCall}
                disabled={!activeChat || activeChat.isGroup}
                className="rounded-full p-2 transition-colors hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title={activeChat?.isGroup ? "Không hỗ trợ gọi nhóm" : "Gọi thoại"}
              >
                <Phone className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleStartVideoCall}
                disabled={!activeChat || activeChat.isGroup}
                className="rounded-full p-2 transition-colors hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title={activeChat?.isGroup ? "Không hỗ trợ gọi nhóm" : "Gọi video"}
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
                        {/* Display video, image, or text */}
                        {message.isVideo ? (
                          <video
                            src={message.text}
                            controls
                            className="max-w-full max-h-64 rounded-lg"
                            preload="metadata"
                          />
                        ) : message.isImage ? (
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
                {/* Hidden file input for videos */}
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleSendVideo}
                  className="hidden"
                  id="chat-video-upload"
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
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingVideo || !socketConnected}
                    className="rounded-full p-2 text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Gửi video"
                  >
                    {uploadingVideo ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Video className="h-6 w-6" />
                    )}
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
                  {activeChat.description && (
                    <p className="text-xs text-gray-600 mt-2 px-2 py-1.5 bg-gray-100 rounded-lg text-center">
                      📝 {activeChat.description}
                    </p>
                  )}
                  {isCurrentUserAdmin && (
                    <p className="text-xs text-blue-500 mt-1">Click vào ảnh để thay đổi</p>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2 mb-6">
                  {/* Edit Group (Admin Only) */}
                  {isCurrentUserAdmin && (
                    <>
                      {!isEditingGroup ? (
                        <button
                          type="button"
                          onClick={startEditGroup}
                          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Settings className="h-4 w-4" />
                          Chỉnh sửa nhóm
                        </button>
                      ) : (
                        <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-3">
                          <p className="text-sm font-semibold text-gray-700">Chỉnh sửa nhóm</p>
                          <input
                            type="text"
                            value={editGroupName}
                            onChange={(e) => setEditGroupName(e.target.value)}
                            placeholder="Tên nhóm"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                          <textarea
                            value={editGroupDescription}
                            onChange={(e) => setEditGroupDescription(e.target.value)}
                            placeholder="Mô tả nhóm (tùy chọn)"
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleUpdateGroup}
                              disabled={loadingAction || !editGroupName.trim()}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                            >
                              {loadingAction ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              Lưu
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditGroup}
                              disabled={loadingAction}
                              className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      )}
                    </>
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
                          <button
                            type="button"
                            onClick={() => navigate(`/user/${request.userId}`)}
                            className="relative group/avatar"
                            title="Xem trang cá nhân"
                          >
                            <img
                              src={request.avatarUrl || `https://i.pravatar.cc/150?u=${request.userId}`}
                              alt={request.username}
                              className="h-9 w-9 rounded-full object-cover cursor-pointer ring-2 ring-transparent group-hover/avatar:ring-blue-400 transition-all"
                            />
                          </button>
                          <div className="flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => navigate(`/user/${request.userId}`)}
                              className="text-sm font-medium text-gray-900 truncate hover:text-blue-600 hover:underline"
                              title="Xem trang cá nhân"
                            >
                              {request.username || "User"}
                            </button>
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

        {/* Incoming Call Modal */}
        <IncomingCallModal
          isOpen={showIncomingCall}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          callerName={incomingCallData?.callerName || "Người dùng"}
          callerAvatar={incomingCallData?.callerAvatar || ""}
          isVideoCall={incomingCallData?.isVideoCall || false}
        />

        {/* Video/Audio Call Modal */}
        <VideoCallModal
          isOpen={showVideoCall}
          onClose={handleEndCall}
          recipientId={callRecipientId}
          recipientName={activeChat?.name || ""}
          recipientAvatar={activeChat?.avatar || ""}
          isAudioOnly={isAudioOnlyCall}
          callStatus={callStatus}
          socket={socketRef.current}
          isCaller={isCaller}
        />
      </div>
    </div>
  );
};

export default MessagesPage;

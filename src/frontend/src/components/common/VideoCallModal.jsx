import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Phone,
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  X,
  Loader2,
} from "lucide-react";
import {
  initPeerConnection,
  startLocalStream,
  createOffer,
  handleOffer,
  handleAnswer,
  handleIceCandidate,
  stopCall,
  toggleAudio,
  toggleVideo,
} from "../../api/call-video";

const VideoCallModal = ({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  recipientAvatar,
  isAudioOnly = false,
  callStatus = "waiting", // 'waiting', 'connecting', 'connected'
  socket,
  isCaller = false, // true if this user initiated the call
}) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(isAudioOnly);
  const [error, setError] = useState(null);
  const [connectionState, setConnectionState] = useState("new");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const hasInitialized = useRef(false);
  const peerReady = useRef(false);
  const pendingOffer = useRef(null);
  const isMountedRef = useRef(true);

  // Handle remote stream received
  const handleRemoteStream = useCallback((stream) => {
    console.log("🎥 Got remote stream in modal, tracks:", stream.getTracks().map(t => t.kind));
    console.log("🎥 remoteVideoRef.current:", remoteVideoRef.current);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
      console.log("🎥 Remote video srcObject set successfully");
      setIsConnected(true);
      setIsConnecting(false);
    } else {
      console.error("❌ remoteVideoRef.current is null!");
    }
  }, []);

  // Handle connection state changes
  const handleConnectionStateChange = useCallback((state) => {
    console.log("📡 Connection state changed:", state);
    setConnectionState(state);
    
    if (state === "connected") {
      setIsConnected(true);
      setIsConnecting(false);
    } else if (state === "disconnected" || state === "failed" || state === "closed") {
      setIsConnected(false);
    }
  }, []);

  // Initialize WebRTC when call is connecting
  useEffect(() => {
    if (!isOpen || !socket || !recipientId) return;
    
    // Wait for callStatus to be 'connecting' before initializing
    if (callStatus !== "connecting") {
      return;
    }

    // Prevent double initialization
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    let mounted = true;

    const initCall = async () => {
      try {
        console.log("🚀 Initializing WebRTC call, isCaller:", isCaller, "recipientId:", recipientId);

        // Initialize peer connection first
        initPeerConnection(
          socket,
          recipientId,
          handleRemoteStream,
          handleConnectionStateChange
        );

        // Start local stream and get the stream object
        const stream = await startLocalStream(null, isAudioOnly);
        console.log("🎥 Local stream obtained:", stream?.getTracks().map(t => t.kind));

        // Manually set local video
        if (mounted && localVideoRef.current && stream && !isAudioOnly) {
          localVideoRef.current.srcObject = stream;
          console.log("🎥 Local video element set");
        }

        // Mark peer as ready
        peerReady.current = true;
        console.log("✅ Peer connection ready");

        // Process any pending offer that arrived before we were ready
        if (pendingOffer.current && !isCaller) {
          console.log("📥 Processing pending offer");
          await handleOffer(pendingOffer.current);
          pendingOffer.current = null;
        }

        if (mounted) {
          setIsConnecting(false);

          // Only caller creates and sends offer
          // Add delay to ensure receiver has set up peer connection
          if (isCaller) {
            console.log("📤 Caller waiting 1.5s before creating offer...");
            setTimeout(async () => {
              if (mounted) {
                console.log("📤 Caller creating offer now");
                await createOffer();
              }
            }, 1500);
          }
        }
      } catch (err) {
        console.error("Error initializing call:", err);
        if (mounted) {
          setError("Không thể truy cập camera/microphone");
          setIsConnecting(false);
        }
      }
    };

    initCall();

    return () => {
      mounted = false;
    };
  }, [
    isOpen,
    socket,
    recipientId,
    callStatus,
    isCaller,
    isAudioOnly,
    handleRemoteStream,
    handleConnectionStateChange,
  ]);

  // Listen for WebRTC signaling events - setup immediately when modal opens
  useEffect(() => {
    if (!socket || !isOpen) return;

    // Handle incoming offer (for receiver)
    const onOffer = async (data) => {
      console.log("📥 Received WebRTC offer from:", data.fromUserId, "peerReady:", peerReady.current);
      if (data.fromUserId === recipientId) {
        if (peerReady.current) {
          await handleOffer(data.offer);
        } else {
          console.log("⏳ Queuing offer, peer not ready yet");
          pendingOffer.current = data.offer;
        }
      }
    };

    // Handle incoming answer (for caller)
    const onAnswer = async (data) => {
      console.log("📥 Received WebRTC answer from:", data.fromUserId);
      if (data.fromUserId === recipientId) {
        await handleAnswer(data.answer);
      }
    };

    // Handle incoming ICE candidate
    const onIceCandidate = async (data) => {
      console.log("📥 Received ICE candidate from:", data.fromUserId);
      if (data.fromUserId === recipientId) {
        await handleIceCandidate(data.candidate);
      }
    };

    socket.on("webrtc-offer", onOffer);
    socket.on("webrtc-answer", onAnswer);
    socket.on("webrtc-ice-candidate", onIceCandidate);

    return () => {
      socket.off("webrtc-offer", onOffer);
      socket.off("webrtc-answer", onAnswer);
      socket.off("webrtc-ice-candidate", onIceCandidate);
    };
  }, [socket, isOpen, recipientId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasInitialized.current = false;
      peerReady.current = false;
      pendingOffer.current = null;
      setIsConnecting(true);
      setIsConnected(false);
      setError(null);
      setConnectionState("new");
    }
  }, [isOpen]);

  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    toggleAudio(!newMutedState);
  };

  const handleToggleVideo = () => {
    if (isAudioOnly) return;
    const newVideoState = !isVideoOff;
    setIsVideoOff(newVideoState);
    toggleVideo(!newVideoState);
  };

  const handleEndCall = () => {
    stopCall();
    onClose();
  };

  if (!isOpen) return null;

  // Determine status message
  const getStatusMessage = () => {
    if (error) return error;
    if (callStatus === "waiting") return "Đang chờ đối phương trả lời...";
    if (isConnected) return "Đã kết nối";
    if (connectionState === "connecting") return "Đang thiết lập kết nối...";
    return "Đang kết nối...";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="relative h-full w-full max-w-6xl p-4">
        {/* Close button */}
        <button
          type="button"
          onClick={handleEndCall}
          className="absolute right-6 top-6 z-10 rounded-full bg-gray-800/50 p-2 text-white transition-all hover:bg-gray-700"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Main video area */}
        <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gray-900">
          {/* Remote video (full screen) - always render but hide when not connected */}
          <div className="relative h-full w-full">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`h-full w-full object-cover ${isConnected ? '' : 'hidden'}`}
            />
            {!isConnected && (
              <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center text-white">
                <img
                  src={recipientAvatar}
                  alt={recipientName}
                  className="mb-4 h-32 w-32 rounded-full object-cover"
                />
                <h3 className="mb-2 text-2xl font-semibold">{recipientName}</h3>
                <div className="flex items-center gap-2 text-gray-300">
                  {!error && <Loader2 className="h-5 w-5 animate-spin" />}
                  <p className={error ? "text-red-400" : ""}>
                    {getStatusMessage()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Local video (picture-in-picture) */}
          {!isAudioOnly && (
            <div className="absolute right-6 top-6 overflow-hidden rounded-xl bg-gray-800 shadow-2xl">
              <div className="relative h-48 w-64">
                {isVideoOff ? (
                  <div className="flex h-full w-full items-center justify-center bg-gray-800 text-white">
                    <div className="text-center">
                      <VideoOff className="mx-auto mb-2 h-8 w-8" />
                      <p className="text-sm">Camera đã tắt</p>
                    </div>
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </div>
          )}

          {/* Audio only indicator */}
          {isAudioOnly && (
            <div className="absolute right-6 top-6 rounded-xl bg-gray-800/80 p-4 shadow-2xl">
              <div className="flex items-center gap-3 text-white">
                <Phone className="h-6 w-6" />
                <span className="text-sm font-medium">Cuộc gọi thoại</span>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-4">
            {/* Mute button */}
            <button
              type="button"
              onClick={handleToggleMute}
              className={`rounded-full p-4 shadow-lg transition-all ${
                isMuted
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {isMuted ? (
                <MicOff className="h-6 w-6 text-white" />
              ) : (
                <Mic className="h-6 w-6 text-white" />
              )}
            </button>

            {/* Video toggle button (only for video calls) */}
            {!isAudioOnly && (
              <button
                type="button"
                onClick={handleToggleVideo}
                className={`rounded-full p-4 shadow-lg transition-all ${
                  isVideoOff
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                {isVideoOff ? (
                  <VideoOff className="h-6 w-6 text-white" />
                ) : (
                  <Video className="h-6 w-6 text-white" />
                )}
              </button>
            )}

            {/* End call button */}
            <button
              type="button"
              onClick={handleEndCall}
              className="rounded-full bg-red-500 p-4 shadow-lg transition-all hover:bg-red-600"
            >
              <PhoneOff className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Call info */}
          <div className="absolute left-6 top-6 rounded-lg bg-gray-800/50 px-4 py-2 backdrop-blur-sm">
            <p className="text-sm font-medium text-white">{recipientName}</p>
            <p className="text-xs text-gray-300">
              {isConnected ? "Đã kết nối" : getStatusMessage()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;

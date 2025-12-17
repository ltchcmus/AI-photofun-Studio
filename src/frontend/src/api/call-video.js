// Build ICE servers configuration
const buildIceServers = () => {
  const iceServers = [
    // Google STUN servers (miễn phí và ổn định)
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:stun.l.google.com:19302" },

    // Twilio STUN (public, no auth needed)
    { urls: "stun:global.stun.twilio.com:3478" },
  ];

  // Add custom TURN servers from environment variables (if configured)
  if (import.meta.env.VITE_TURN_URL_1 && import.meta.env.VITE_TURN_USERNAME_1) {
    iceServers.push({
      urls: import.meta.env.VITE_TURN_URL_1,
      username: import.meta.env.VITE_TURN_USERNAME_1,
      credential: import.meta.env.VITE_TURN_CREDENTIAL_1,
    });
    console.log("✅ Custom TURN server 1 configured");
  }

  if (import.meta.env.VITE_TURN_URL_2 && import.meta.env.VITE_TURN_USERNAME_2) {
    iceServers.push({
      urls: import.meta.env.VITE_TURN_URL_2,
      username: import.meta.env.VITE_TURN_USERNAME_2,
      credential: import.meta.env.VITE_TURN_CREDENTIAL_2,
    });
    console.log("✅ Custom TURN server 2 configured");
  }

  if (import.meta.env.VITE_TURN_URL_3 && import.meta.env.VITE_TURN_USERNAME_3) {
    iceServers.push({
      urls: import.meta.env.VITE_TURN_URL_3,
      username: import.meta.env.VITE_TURN_USERNAME_3,
      credential: import.meta.env.VITE_TURN_CREDENTIAL_3,
    });
    console.log("✅ Custom TURN server 3 configured");
  }

  // Fallback TURN servers (OpenRelay - miễn phí nhưng có thể bị chặn)
  iceServers.push(
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    }
  );

  return iceServers;
};

const servers = {
  iceServers: buildIceServers(),
  iceCandidatePoolSize: 20,
  // Thêm cấu hình để tối ưu kết nối
  iceTransportPolicy: "all", // Cho phép cả relay và direct connection
  bundlePolicy: "max-bundle", // Gom tất cả media vào một kết nối
  rtcpMuxPolicy: "require", // Giảm số lượng ports cần thiết
};

let peerConnection = null;
let localStream = null;
let currentSocket = null;
let currentRemoteUserId = null;
let iceCandidateQueue = []; // Queue for ICE candidates received before remote description

export function initPeerConnection(
  socket,
  remoteUserId,
  onRemoteStream,
  onConnectionStateChange
) {
  if (peerConnection) {
    peerConnection.close();
  }

  currentSocket = socket;
  currentRemoteUserId = remoteUserId;
  iceCandidateQueue = []; // Reset queue

  console.log("🔧 Initializing peer connection with config:", {
    iceServersCount: servers.iceServers.length,
    remoteUserId,
  });

  peerConnection = new RTCPeerConnection(servers);

  peerConnection.onicecandidate = (event) => {
    if (event.candidate && currentSocket) {
      console.log(
        "📤 Sending ICE candidate to:",
        currentRemoteUserId,
        "type:",
        event.candidate.type
      );
      currentSocket.emit("webrtc-ice-candidate", {
        targetUserId: currentRemoteUserId,
        candidate: event.candidate,
      });
    } else if (!event.candidate) {
      console.log("✅ All ICE candidates have been sent");
    }
  };

  peerConnection.ontrack = (event) => {
    console.log("🎥 Received remote track:", event.streams);
    if (event.streams && event.streams[0] && onRemoteStream) {
      onRemoteStream(event.streams[0]);
    }
  };

  peerConnection.onconnectionstatechange = () => {
    console.log("📡 Connection state:", peerConnection.connectionState);
    if (onConnectionStateChange) {
      onConnectionStateChange(peerConnection.connectionState);
    }
  };

  peerConnection.oniceconnectionstatechange = () => {
    console.log("🧊 ICE connection state:", peerConnection.iceConnectionState);
    if (peerConnection.iceConnectionState === "failed") {
      console.error("❌ ICE connection failed. Restarting ICE...");
      peerConnection.restartIce();
    }
  };

  peerConnection.onicegatheringstatechange = () => {
    console.log("🔍 ICE gathering state:", peerConnection.iceGatheringState);
  };

  return peerConnection;
}

export async function startLocalStream(videoElement, audioOnly = false) {
  try {
    const constraints = audioOnly
      ? { video: false, audio: true }
      : { video: true, audio: true };

    console.log("📹 Requesting media with constraints:", constraints);
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log(
      "📹 Got local stream with tracks:",
      localStream.getTracks().map((t) => `${t.kind}:${t.enabled}`)
    );

    if (videoElement) {
      videoElement.srcObject = localStream;
      console.log("📹 Set video element srcObject");
    }

    if (peerConnection && localStream) {
      localStream.getTracks().forEach((track) => {
        console.log("➕ Adding track to peer connection:", track.kind);
        peerConnection.addTrack(track, localStream);
      });
      console.log("📹 All tracks added to peer connection");
    } else {
      console.warn(
        "⚠️ peerConnection or localStream not ready for adding tracks"
      );
    }

    return localStream;
  } catch (error) {
    console.error("Error accessing media devices:", error);
    throw error;
  }
}

export async function createOffer() {
  console.log(
    "🔍 createOffer called, peerConnection:",
    !!peerConnection,
    "currentSocket:",
    !!currentSocket
  );

  if (!peerConnection || !currentSocket) {
    console.error(
      "❌ Peer connection or socket not initialized for createOffer"
    );
    return;
  }

  try {
    console.log("📤 Creating offer...");
    const offer = await peerConnection.createOffer();
    console.log("📤 Offer created, setting local description...");
    await peerConnection.setLocalDescription(offer);

    console.log("📤 Sending offer to:", currentRemoteUserId);
    currentSocket.emit("webrtc-offer", {
      targetUserId: currentRemoteUserId,
      offer: peerConnection.localDescription,
    });
    console.log("📤 Offer emitted successfully");
  } catch (error) {
    console.error("Error creating offer:", error);
  }
}

export async function handleOffer(offer) {
  if (!peerConnection || !currentSocket) {
    console.error(
      "❌ Peer connection or socket not initialized for handleOffer"
    );
    return;
  }

  if (!localStream) {
    console.error("❌ Local stream not ready for handleOffer");
    return;
  }

  try {
    console.log(
      "📥 Processing offer, localStream tracks:",
      localStream.getTracks().map((t) => t.kind)
    );
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    console.log("✅ Remote description set successfully");

    // Process any queued ICE candidates
    if (iceCandidateQueue.length > 0) {
      console.log(
        `📥 Processing ${iceCandidateQueue.length} queued ICE candidates`
      );
      for (const candidate of iceCandidateQueue) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
      iceCandidateQueue = [];
    }

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    console.log("📤 Sending answer to:", currentRemoteUserId);
    currentSocket.emit("webrtc-answer", {
      targetUserId: currentRemoteUserId,
      answer: peerConnection.localDescription,
    });
  } catch (error) {
    console.error("Error handling offer:", error);
  }
}

export async function handleAnswer(answer) {
  if (!peerConnection) {
    console.error("Peer connection not initialized");
    return;
  }

  try {
    console.log("📥 Processing answer");
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(answer)
    );
    console.log("✅ Remote description set successfully");

    // Process any queued ICE candidates
    if (iceCandidateQueue.length > 0) {
      console.log(
        `📥 Processing ${iceCandidateQueue.length} queued ICE candidates`
      );
      for (const candidate of iceCandidateQueue) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
      iceCandidateQueue = [];
    }
  } catch (error) {
    console.error("Error handling answer:", error);
  }
}

export async function handleIceCandidate(candidate) {
  if (!peerConnection) {
    console.error("Peer connection not initialized");
    return;
  }

  try {
    // If remote description is not set yet, queue the candidate
    if (!peerConnection.remoteDescription) {
      console.log("⏳ Queuing ICE candidate (remote description not set yet)");
      iceCandidateQueue.push(candidate);
      return;
    }

    console.log("📥 Adding ICE candidate type:", candidate.type);
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    console.log("✅ ICE candidate added successfully");
  } catch (error) {
    console.error("Error handling ICE candidate:", error);
  }
}

export function stopCall() {
  console.log("🔴 Stopping call...");

  if (localStream) {
    localStream.getTracks().forEach((track) => {
      track.stop();
    });
    localStream = null;
  }

  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  currentSocket = null;
  currentRemoteUserId = null;
  iceCandidateQueue = []; // Clear queue
}

export function toggleAudio(enabled) {
  if (localStream) {
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }
}

export function toggleVideo(enabled) {
  if (localStream) {
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }
}

export function getConnectionState() {
  return peerConnection?.connectionState || "closed";
}

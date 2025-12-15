const servers = {
  iceServers: [
    // STUN servers
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun.l.google.com:19302" },
    // Free TURN servers from OpenRelay (for NAT traversal)
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
    },
  ],
  iceCandidatePoolSize: 10,
};

let peerConnection = null;
let localStream = null;
let currentSocket = null;
let currentRemoteUserId = null;

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

  peerConnection = new RTCPeerConnection(servers);

  peerConnection.onicecandidate = (event) => {
    if (event.candidate && currentSocket) {
      console.log("📤 Sending ICE candidate to:", currentRemoteUserId);
      currentSocket.emit("webrtc-ice-candidate", {
        targetUserId: currentRemoteUserId,
        candidate: event.candidate,
      });
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
    console.log("📥 Adding ICE candidate");
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
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

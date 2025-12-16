package service.communication.controller;

import com.corundumstudio.socketio.AckRequest;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import service.communication.DTOs.request.AnswerCallRequest;
import service.communication.DTOs.request.CallUserRequest;
import service.communication.DTOs.request.EndCallRequest;
import service.communication.DTOs.request.RejectCallRequest;
import service.communication.DTOs.request.SendMessageGroupRequest;
import service.communication.DTOs.request.SendMessageRequest;
import service.communication.entity.Communication;
import service.communication.entity.GroupMessage;
import service.communication.repository.http.IdentityClient;
import service.communication.service.CommunicationService;
import service.communication.service.ConversationService;
import service.communication.service.GroupService;
import service.communication.utils.Utils;

@Component
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Data
@Builder
@Slf4j
public class WebSocket {

  SocketIOServer server;
  CommunicationService communicationService;
  ConversationService conversationService;
  GroupService groupService;
  Utils utils;
  Map<String, String> sessionToUserId = new HashMap<>();
  Map<String, SocketIOClient> userIdToClient = new HashMap<>();
  IdentityClient identityClient;

  public WebSocket(SocketIOServer server,
                   CommunicationService communicationService,
                   ConversationService conversationService,
                   GroupService groupService, Utils utils,
                   IdentityClient identityClient) {
    this.server = server;
    this.communicationService = communicationService;
    this.conversationService = conversationService;
    this.groupService = groupService;
    this.utils = utils;
    this.identityClient = identityClient;

    this.server.addConnectListener(this::onConnect);
    this.server.addDisconnectListener(this::onDisconnect);
    this.server.addEventListener("sendMessage", SendMessageRequest.class,
                                 this::sendMessage);
    this.server.addEventListener("joinRoom", String.class, this::join);
    this.server.addEventListener("leaveRoom", String.class, this::leave);
    this.server.addEventListener("sendMessageToGroup",
                                 SendMessageGroupRequest.class,
                                 this::sendMessageToGroup);

    // Call events
    this.server.addEventListener("callUser", CallUserRequest.class,
                                 this::handleCallUser);
    this.server.addEventListener("answerCall", AnswerCallRequest.class,
                                 this::handleAnswerCall);
    this.server.addEventListener("rejectCall", RejectCallRequest.class,
                                 this::handleRejectCall);
    this.server.addEventListener("endCall", EndCallRequest.class,
                                 this::handleEndCall);

    // WebRTC Signaling events
    this.server.addEventListener("webrtc-offer", Map.class,
                                 this::handleWebRTCOffer);
    this.server.addEventListener("webrtc-answer", Map.class,
                                 this::handleWebRTCAnswer);
    this.server.addEventListener("webrtc-ice-candidate", Map.class,
                                 this::handleWebRTCIceCandidate);
  }

  private void onConnect(SocketIOClient client) {
    log.info("New client connected: " + client.getSessionId());
    sessionToUserId.put(String.valueOf(client.getSessionId()),
                        client.getHandshakeData().getSingleUrlParam("userId"));
    userIdToClient.put(client.getHandshakeData().getSingleUrlParam("userId"),
                       client);

    List<String> groupJoined =
        identityClient
            .getGroupJoinedInternal(
                client.getHandshakeData().getSingleUrlParam("userId"))
            .getResult();
    for (String groupId : groupJoined) {
      client.joinRoom(groupId);
    }
  }
  private void onDisconnect(SocketIOClient client) {
    log.info("Client disconnected: " + client.getSessionId());
    String userId = sessionToUserId.get(String.valueOf(client.getSessionId()));
    sessionToUserId.remove(String.valueOf(client.getSessionId()));
    userIdToClient.remove(userId);

    List<String> groupJoined =
        identityClient.getGroupJoinedInternal(userId).getResult();
    for (String groupId : groupJoined) {
      client.leaveRoom(groupId);
    }
  }

  private void sendMessage(SocketIOClient client, SendMessageRequest data,
                           AckRequest ackRequest) {
    String conversationId =
        utils.generateMongoId(data.getSenderId(), data.getReceiverId());

    SocketIOClient receiverClient = userIdToClient.get(data.getReceiverId());
    if (receiverClient != null) {
      receiverClient.sendEvent("receiveMessage", data);
    }

    // Auto-create conversation if not exists
    try {
      conversationService.autoAddConversation(data.getSenderId(),
                                              data.getReceiverId());
    } catch (Exception e) {
      log.warn("Failed to auto-create conversation between {} and {}: {}",
               data.getSenderId(), data.getReceiverId(), e.getMessage());
    }

    Communication communication = Communication.builder()
                                      .conversationId(conversationId)
                                      .senderId(data.getSenderId())
                                      .message(data.getMessage())
                                      .isImage(data.isImage())
                                      .build();
    communicationService.addCommunication(communication);
  }

  private void join(SocketIOClient client, String groupId,
                    AckRequest ackRequest) {
    client.joinRoom(groupId);
    log.info("Client {} joined room {}", client.getSessionId(), groupId);
  }

  private void leave(SocketIOClient client, String groupId,
                     AckRequest ackRequest) {
    client.leaveRoom(groupId);
    log.info("Client {} left room {}", client.getSessionId(), groupId);
  }

  private void sendMessageToGroup(SocketIOClient client,
                                  SendMessageGroupRequest data,
                                  AckRequest ackRequest) {
    log.info("Sending message to group {}: {}", data.getGroupId(),
             data.getMessage());

    // Save message to database
    GroupMessage message = GroupMessage.builder()
                               .groupId(data.getGroupId())
                               .senderId(data.getSenderId())
                               .message(data.getMessage())
                               .isImage(data.isImage())
                               .build();
    groupService.addGroupMessage(message);

    // Broadcast to all members in the room
    server.getRoomOperations(data.getGroupId())
        .sendEvent("receiveGroupMessage", data);

    log.info("Message broadcasted to room {}", data.getGroupId());
  }

  // WebRTC Call Handlers
  private void handleCallUser(SocketIOClient client, CallUserRequest data,
                              AckRequest ackRequest) {
    log.info("Call request from {} to {}", data.getCallerId(),
             data.getReceiverId());

    SocketIOClient receiverClient = userIdToClient.get(data.getReceiverId());

    if (receiverClient != null && receiverClient.isChannelOpen()) {
      // Send incoming call event to receiver
      receiverClient.sendEvent("incomingCall",
                               Map.of("callerId", data.getCallerId(),
                                      "receiverId", data.getReceiverId(),
                                      "isVideoCall", data.isVideoCall(),
                                      "callId", data.getCallId()));
      log.info("Incoming call sent to {}", data.getReceiverId());
    } else {
      // Receiver is offline
      client.sendEvent("callFailed",
                       Map.of("message", "Người dùng không online",
                              "receiverId", data.getReceiverId()));
      log.info("Call failed - receiver {} is offline", data.getReceiverId());
    }
  }

  private void handleAnswerCall(SocketIOClient client, AnswerCallRequest data,
                                AckRequest ackRequest) {
    log.info("Call answered by {} to {}", data.getReceiverId(),
             data.getCallerId());

    SocketIOClient callerClient = userIdToClient.get(data.getCallerId());

    if (callerClient != null && callerClient.isChannelOpen()) {
      // Send call accepted event to caller
      callerClient.sendEvent("callAccepted",
                             Map.of("callerId", data.getCallerId(),
                                    "receiverId", data.getReceiverId(),
                                    "callId", data.getCallId(), "isVideoCall",
                                    data.isVideoCall()));
      log.info("Call accepted event sent to caller {}", data.getCallerId());
    } else {
      log.warn("Caller {} not found or offline", data.getCallerId());
    }
  }

  private void handleRejectCall(SocketIOClient client, RejectCallRequest data,
                                AckRequest ackRequest) {
    log.info("Call rejected by {} from {}", data.getReceiverId(),
             data.getCallerId());

    SocketIOClient callerClient = userIdToClient.get(data.getCallerId());

    if (callerClient != null && callerClient.isChannelOpen()) {
      // Send call rejected event to caller
      callerClient.sendEvent("callRejected",
                             Map.of("callerId", data.getCallerId(),
                                    "receiverId", data.getReceiverId(),
                                    "callId", data.getCallId()));
      log.info("Call rejected event sent to caller {}", data.getCallerId());
    } else {
      log.warn("Caller {} not found or offline", data.getCallerId());
    }
  }

  private void handleEndCall(SocketIOClient client, EndCallRequest data,
                             AckRequest ackRequest) {
    log.info("Call ended by {} with {}", data.getUserId(),
             data.getOtherUserId());

    SocketIOClient otherClient = userIdToClient.get(data.getOtherUserId());

    if (otherClient != null && otherClient.isChannelOpen()) {
      // Send call ended event to other user
      otherClient.sendEvent("callEnded",
                            Map.of("userId", data.getUserId(), "otherUserId",
                                   data.getOtherUserId()));
      log.info("Call ended event sent to {}", data.getOtherUserId());
    } else {
      log.warn("Other user {} not found or offline", data.getOtherUserId());
    }
  }

  // WebRTC Signaling Handlers
  private void handleWebRTCOffer(SocketIOClient client,
                                 Map<String, Object> data,
                                 AckRequest ackRequest) {
    String targetUserId = (String)data.get("targetUserId");
    Object offer = data.get("offer");
    String fromUserId =
        sessionToUserId.get(String.valueOf(client.getSessionId()));

    log.info("WebRTC offer from {} to {}", fromUserId, targetUserId);

    SocketIOClient targetClient = userIdToClient.get(targetUserId);
    if (targetClient != null && targetClient.isChannelOpen()) {
      targetClient.sendEvent("webrtc-offer",
                             Map.of("fromUserId", fromUserId, "offer", offer));
      log.info("WebRTC offer forwarded to {}", targetUserId);
    } else {
      log.warn("Target user {} not found or offline for WebRTC offer",
               targetUserId);
    }
  }

  private void handleWebRTCAnswer(SocketIOClient client,
                                  Map<String, Object> data,
                                  AckRequest ackRequest) {
    String targetUserId = (String)data.get("targetUserId");
    Object answer = data.get("answer");
    String fromUserId =
        sessionToUserId.get(String.valueOf(client.getSessionId()));

    log.info("WebRTC answer from {} to {}", fromUserId, targetUserId);

    SocketIOClient targetClient = userIdToClient.get(targetUserId);
    if (targetClient != null && targetClient.isChannelOpen()) {
      targetClient.sendEvent(
          "webrtc-answer", Map.of("fromUserId", fromUserId, "answer", answer));
      log.info("WebRTC answer forwarded to {}", targetUserId);
    } else {
      log.warn("Target user {} not found or offline for WebRTC answer",
               targetUserId);
    }
  }

  private void handleWebRTCIceCandidate(SocketIOClient client,
                                        Map<String, Object> data,
                                        AckRequest ackRequest) {
    String targetUserId = (String)data.get("targetUserId");
    Object candidate = data.get("candidate");
    String fromUserId =
        sessionToUserId.get(String.valueOf(client.getSessionId()));

    log.info("WebRTC ICE candidate from {} to {}", fromUserId, targetUserId);

    SocketIOClient targetClient = userIdToClient.get(targetUserId);
    if (targetClient != null && targetClient.isChannelOpen()) {
      targetClient.sendEvent(
          "webrtc-ice-candidate",
          Map.of("fromUserId", fromUserId, "candidate", candidate));
      log.info("WebRTC ICE candidate forwarded to {}", targetUserId);
    } else {
      log.warn("Target user {} not found or offline for ICE candidate",
               targetUserId);
    }
  }
}

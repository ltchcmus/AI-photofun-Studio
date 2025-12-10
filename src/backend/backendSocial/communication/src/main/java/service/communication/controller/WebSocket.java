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
    String id = utils.generateMongoId(data.getSenderId(), data.getReceiverId());

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
                                      .id(id)
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
}

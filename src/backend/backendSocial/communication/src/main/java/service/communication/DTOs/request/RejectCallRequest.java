package service.communication.DTOs.request;

import lombok.Data;

@Data
public class RejectCallRequest {
  private String callerId;
  private String receiverId;
  private String callId;
}

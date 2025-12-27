package service.communication.DTOs.request;

import lombok.Data;

@Data
public class EndCallRequest {
  private String userId;
  private String otherUserId;
}

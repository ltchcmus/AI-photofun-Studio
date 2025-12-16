package service.communication.DTOs.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class AnswerCallRequest {
  private String callerId;
  private String receiverId;
  private String callId;

  @JsonProperty("isVideoCall") private boolean isVideoCall;

  public boolean isVideoCall() { return isVideoCall; }
}

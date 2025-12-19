package service.communication.DTOs.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GroupMessageResponse {
  String id;
  String groupId;
  String senderId;
  String message;
  boolean isImage;
  boolean isVideo;
  String timestamp;
}

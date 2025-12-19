package service.communication.DTOs.request;

import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Slf4j
public class SendMessageGroupRequest {
    String senderId;
    String groupId;
    String message;
    boolean isImage;
    boolean isVideo;
}

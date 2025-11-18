package service.communication.DTOs.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Slf4j
public class SendMessageRequest {
    @NotBlank(message = "SENDER_ID_EMPTY")
    String senderId;
    @NotBlank(message = "RECEIVER_ID_EMPTY")
    String receiverId;
    @NotBlank(message = "MESSAGE_EMPTY")
    String message;

    boolean isImage;
}

package service.communication.DTOs.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Slf4j
public class GetMessageCoupleResponse {
    String userId;
    String message;
    boolean isImage;
    String timestamp;
}

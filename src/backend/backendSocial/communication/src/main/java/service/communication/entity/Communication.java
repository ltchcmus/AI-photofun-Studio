package service.communication.entity;

import java.time.Instant;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;


@Document("communications")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Communication {
  @MongoId String id;    // Auto-generated unique ID for each message
  String conversationId; // userId1__userId2 to group messages between 2 users
  String senderId;
  String message;
  boolean isImage;
  boolean isVideo;
  @Builder.Default Instant timestamp = Instant.now();
}

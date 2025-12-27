package service.communication.entity;

import java.time.Instant;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;


@Document("group_messages")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GroupMessage {
  @MongoId String id;
  String groupId;
  String senderId;
  String message;
  boolean isImage;
  boolean isVideo;
  @Builder.Default Instant timestamp = Instant.now();
}

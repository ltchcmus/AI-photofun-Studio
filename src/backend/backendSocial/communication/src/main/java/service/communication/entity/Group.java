package service.communication.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;


@Document("groups")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Group {
  @MongoId String groupId;
  String image;
  String name;
  String description;
  String adminId;
  @Builder.Default List<String> memberIds = new ArrayList<>();

  @Builder.Default Instant createdAt = Instant.now();

  @Builder.Default Instant updatedAt = Instant.now();
}

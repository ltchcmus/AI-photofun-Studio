package service.communication.DTOs.response;

import java.time.Instant;
import lombok.*;
import lombok.experimental.FieldDefaults;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GroupDetailResponse {
  String groupId;
  String name;
  String image;
  String description;
  String adminId;
  int memberCount;
  Instant createdAt;
  Instant updatedAt;
}

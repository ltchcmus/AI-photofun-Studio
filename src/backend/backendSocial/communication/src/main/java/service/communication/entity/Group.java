package service.communication.entity;


import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.util.ArrayList;
import java.util.List;

@Document("groups")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Group {
    @MongoId
    String groupId;
    String image;
    String name;
    String adminId;
    @Builder.Default
    List<String> memberIds = new ArrayList<>();
}

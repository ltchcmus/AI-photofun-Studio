package service.communication.entity;



import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;

@Document("communications")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Communication {
    @MongoId
    String id;
    String senderId;
    String message;
    boolean isImage;

    @Builder.Default
    Instant timestamp = Instant.now();
}

package service.communication.entity;

import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

@Getter
@Setter
@Slf4j
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document("conversations")
public class Conversation {
    @MongoId
    String conversationId;
    @Indexed
    String userIdA;
    @Indexed
    String userIdB;
}

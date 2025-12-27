package service.identity.entity;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "likes",
       uniqueConstraints =
           @UniqueConstraint(columnNames = {"user_id", "post_id"}),
       indexes =
       {
         @Index(name = "idx_user_id", columnList = "user_id")
         , @Index(name = "idx_post_id", columnList = "post_id")
       })
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Like {

  @Id @GeneratedValue(strategy = GenerationType.UUID) String likeId;

  @Column(name = "user_id", nullable = false) String userId;

  @Column(name = "post_id", nullable = false) String postId;

  @Builder.Default @Column(nullable = false) Instant createdAt = Instant.now();
}

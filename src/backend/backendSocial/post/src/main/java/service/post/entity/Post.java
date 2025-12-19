package service.post.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;


@Entity
@Getter
@Setter
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "posts")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Post {
    @Id
    //@GeneratedValue(strategy = GenerationType.UUID)
    String postId;

    @Column(nullable = false)
    String userId;
    String caption;
    String imageUrl;
    String videoUrl;
    String prompt;


    @Builder.Default
    long likes = 0;

    @Builder.Default
    long comments = 0;

    @Builder.Default
    Instant createdAt = Instant.now();
}

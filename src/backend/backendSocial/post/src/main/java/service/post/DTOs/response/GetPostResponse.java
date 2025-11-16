package service.post.DTOs.response;


import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;


@Slf4j
@Builder
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
public class GetPostResponse {
    String postId;
    String userId;
    String caption;
    String imageUrl;
    String prompt;
    long likes = 0;
    long comments = 0;
    String createdAt;
}

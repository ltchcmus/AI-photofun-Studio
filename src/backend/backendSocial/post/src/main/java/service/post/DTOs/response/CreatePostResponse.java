package service.post.DTOs.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Builder
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreatePostResponse {
    String postId;
    String userId;
    String caption;
    String imageUrl;
    String prompt;
    long likes;
    long comments;
    String createdAt;
}

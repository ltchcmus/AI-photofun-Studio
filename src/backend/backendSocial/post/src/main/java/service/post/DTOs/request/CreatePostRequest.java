package service.post.DTOs.request;


import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Builder
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreatePostRequest {
    String caption;
    MultipartFile image;
    String prompt;
}

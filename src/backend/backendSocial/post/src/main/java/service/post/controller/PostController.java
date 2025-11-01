package service.post.controller;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import service.post.DTOs.HttpResponse;
import service.post.DTOs.request.CreatePostRequest;
import service.post.DTOs.response.CreatePostResponse;
import service.post.DTOs.response.PageResponse;
import service.post.entity.Post;
import service.post.exception.AppException;
import service.post.exception.ErrorCode;
import service.post.service.PostService;

@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class PostController {
    PostService postService;

    @PostMapping("/create")
    HttpResponse<CreatePostResponse> createPost(@RequestPart("caption")  String caption,
                                                @RequestPart("prompt") String prompt,
                                                @RequestPart("image")MultipartFile image) {
        CreatePostRequest createPostRequest = CreatePostRequest.builder()
                .caption(caption)
                .prompt(prompt)
                .image(image)
                .build();
        return HttpResponse.<CreatePostResponse>builder()
                .code(1000)
                .result(postService.create(createPostRequest))
                .message("Post created successfully")
                .build();
    }

    @DeleteMapping("/delete-all")
    HttpResponse<Void> deleteAll() {
        postService.deleteAll();
        return HttpResponse.<Void>builder()
                .code(1000)
                .message("All posts deleted successfully")
                .build();
    }

    @GetMapping("/my-posts")
    HttpResponse<PageResponse<Post>> getAllByUserId(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return HttpResponse.<PageResponse<Post>>builder()
                .code(1000)
                .result(postService.getAllByUserId(page - 1, size))
                .message("User posts retrieved successfully")
                .build();
    }

    @GetMapping("/get-all")
    HttpResponse<PageResponse<Post>> getAll(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return HttpResponse.<PageResponse<Post>>builder()
                .code(1000)
                .result(postService.getAll(page - 1, size))
                .message("All posts retrieved successfully")
                .build();
    }

    @GetMapping("/download/{uuid}")
    ResponseEntity<Resource> downloadImage(@PathVariable String uuid) {
        try {
            return postService.downloadImage(uuid);
        } catch (Exception e) {
            throw new AppException(ErrorCode.CANT_DOWNLOAD_IMAGE);
        }
    }

}

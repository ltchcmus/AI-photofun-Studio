package service.post.service;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import service.post.DTOs.HttpResponse;
import service.post.DTOs.request.CreatePostRequest;
import service.post.DTOs.response.CreatePostResponse;
import service.post.DTOs.response.PageResponse;
import service.post.DTOs.response.file.UploadFileResponse;
import service.post.entity.Post;
import service.post.exception.AppException;
import service.post.exception.ErrorCode;
import service.post.mapper.PostMapper;
import service.post.repository.PostRepository;
import service.post.repository.http.FileClient;

import java.net.MalformedURLException;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class PostService {
    FileClient fileClient;
    PostRepository postRepository;
    PostMapper postMapper;

    public CreatePostResponse create(CreatePostRequest createPostRequest){
        MultipartFile image = createPostRequest.getImage();
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        CreatePostResponse createPostResponse;
        try{
            HttpResponse<UploadFileResponse> uploadFileResponse = fileClient.uploadFile(userId, image);
            if(uploadFileResponse.getCode() != 1000){
                log.error("File service returned error code while uploading image: {}", uploadFileResponse.getCode());
                throw new AppException(ErrorCode.DONT_CREATE_POST);
            }
            String imageUrl = uploadFileResponse.getResult().getImage();
            Post post = Post.builder()
                    .userId(userId)
                    .caption(createPostRequest.getCaption())
                    .imageUrl(imageUrl)
                    .prompt(createPostRequest.getPrompt())
                    .build();
            Post savePost = postRepository.save(post);
            if(savePost == null){
                log.error("Error while saving post to database");
                throw new AppException(ErrorCode.DONT_CREATE_POST);
            }

            createPostResponse = postMapper.toCreatePostResponse(savePost);
        }catch(Exception e){
            log.error("Error while uploading image to file service: {}", e.getMessage());
            throw new AppException(ErrorCode.DONT_CREATE_POST);
        }

        return createPostResponse;

    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteAll(){
        List<Post> posts = postRepository.findAll();
        for(Post post : posts){
            String uuid = post.getPostId();
            fileClient.deleteFile(uuid);
        }
    }

    @PreAuthorize("isAuthenticated()")
    public PageResponse<Post> getAllByUserId(int page, int size){
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Post> posts = postRepository.findAllByUserId(userId, pageable);
        List<Post> postList = posts.getContent();
        return PageResponse.<Post>builder()
                .totalElements(posts.getTotalElements())
                .totalPages(posts.getTotalPages())
                .currentPage(posts.getNumber())
                .elements(postList)
                .build();
    }

    public PageResponse<Post> getAll(int page, int size){
        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Post> posts = postRepository.findAll(pageable);
        List<Post> postList = posts.getContent();
        return PageResponse.<Post>builder()
                .totalElements(posts.getTotalElements())
                .totalPages(posts.getTotalPages())
                .currentPage(posts.getNumber())
                .elements(postList)
                .build();
    }

    public ResponseEntity<Resource> downloadImage(String uuid) throws MalformedURLException {
        Post post = postRepository.findById(uuid).orElseThrow(() -> {
            log.error("Post not found with id: {}", uuid);
            throw new AppException(ErrorCode.POST_NOT_FOUND);
        });

        String imageUrl = post.getImageUrl();
        Resource resource = new UrlResource(imageUrl);

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}

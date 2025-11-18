package service.post.service;

import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.locks.ReentrantLock;
import jdk.jshell.execution.Util;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
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
import service.post.DTOs.response.GetPostResponse;
import service.post.DTOs.response.PageResponse;
import service.post.DTOs.response.file.UploadFileResponse;
import service.post.entity.Post;
import service.post.exception.AppException;
import service.post.exception.ErrorCode;
import service.post.mapper.PostMapper;
import service.post.repository.PostRepository;
import service.post.repository.http.FileClient;
import service.post.utils.Utils;


@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class PostService {
  FileClient fileClient;
  PostRepository postRepository;
  PostMapper postMapper;
  Utils utils;

  @NonFinal ReentrantLock lock = new ReentrantLock();

  public CreatePostResponse create(CreatePostRequest createPostRequest) {
    MultipartFile image = createPostRequest.getImage();
    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();
    String uuid = UUID.randomUUID().toString();
    CreatePostResponse createPostResponse;
    try {
      HttpResponse<UploadFileResponse> uploadFileResponse =
          fileClient.uploadFile(uuid, image);
      if (uploadFileResponse.getCode() != 1000) {
        log.error("File service returned error code while uploading image: {}",
                  uploadFileResponse.getCode());
        throw new AppException(ErrorCode.DONT_CREATE_POST);
      }
      String imageUrl = uploadFileResponse.getResult().getImage();
      Post post = Post.builder()
                      // a post match a file
                      .postId(uuid)
                      .userId(userId)
                      .caption(createPostRequest.getCaption())
                      .imageUrl(imageUrl)
                      .prompt(createPostRequest.getPrompt())
                      .build();
      Post savePost = postRepository.save(post);
      if (savePost == null) {
        log.error("Error while saving post to database");
        throw new AppException(ErrorCode.DONT_CREATE_POST);
      }

      createPostResponse = postMapper.toCreatePostResponse(savePost);
    } catch (Exception e) {
      log.error("Error while uploading image to file service: {}",
                e.getMessage());
      throw new AppException(ErrorCode.DONT_CREATE_POST);
    }

    return createPostResponse;
  }

  @PreAuthorize("hasRole('ADMIN')")
  public void deleteAll() {
    List<Post> posts = postRepository.findAll();
    for (Post post : posts) {
      String uuid = post.getPostId();
      fileClient.deleteFile(uuid);
    }
  }

  @PreAuthorize("isAuthenticated()")
  public PageResponse<GetPostResponse> getAllByUserId(int page, int size) {
    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();
    Sort sort = Sort.by("createdAt").descending();
    Pageable pageable = PageRequest.of(page, size, sort);
    Page<Post> posts = postRepository.findAllByUserId(userId, pageable);
    List<Post> postList = posts.getContent();
    List<GetPostResponse> getPostResponses = new ArrayList<>();
    for (Post post : postList) {
      GetPostResponse getPostResponse = postMapper.toGetPostResponse(post);
      getPostResponse.setCreatedAt(
          utils.convertInstantToString(post.getCreatedAt()));
      getPostResponses.add(getPostResponse);
    }
    return PageResponse.<GetPostResponse>builder()
        .totalElements(posts.getTotalElements())
        .totalPages(posts.getTotalPages())
        .currentPage(posts.getNumber())
        .elements(getPostResponses)
        .build();
  }

  public PageResponse<GetPostResponse> getAll(int page, int size) {
    Sort sort = Sort.by("createdAt").descending();
    Pageable pageable = PageRequest.of(page, size, sort);
    Page<Post> posts = postRepository.findAll(pageable);
    List<Post> postList = posts.getContent();
    List<GetPostResponse> getPostResponses = new ArrayList<>();
    for (Post post : postList) {
      GetPostResponse getPostResponse = postMapper.toGetPostResponse(post);
      getPostResponse.setCreatedAt(
          utils.convertInstantToString(post.getCreatedAt()));
      getPostResponses.add(getPostResponse);
    }
    return PageResponse.<GetPostResponse>builder()
        .totalElements(posts.getTotalElements())
        .totalPages(posts.getTotalPages())
        .currentPage(posts.getNumber())
        .elements(getPostResponses)
        .build();
  }

  @PreAuthorize(
      "hasAuthority('DOWN') or hasRole('ADMIN') or hasAuthority('ALL')")
  public ResponseEntity<Resource>
  downloadImage(String postId) throws MalformedURLException {
    Post post = postRepository.findById(postId).orElseThrow(() -> {
      log.error("Post not found with id: {}", postId);
      throw new AppException(ErrorCode.POST_NOT_FOUND);
    });

    String imageUrl = post.getImageUrl();
    Resource resource = new UrlResource(imageUrl);

    return ResponseEntity.ok()
        .header("Content-Disposition",
                "attachment; filename=\"" + resource.getFilename() + "\"")
        .body(resource);
  }

  @PreAuthorize("isAuthenticated()")
  public void likePost(String postId, int number) {
    lock.lock();
    try {
      postRepository.addNumberLikes(postId, number);
    } catch (Exception e) {
      log.error("Error while liking post: {}", e.getMessage());
      throw new AppException(ErrorCode.CANT_LIKE_POST);
    } finally {
      lock.unlock();
    }
  }

  @PreAuthorize("isAuthenticated()")
  public GetPostResponse viewPost(String postId) {
    Post post = postRepository.findById(postId).orElseThrow(() -> {
      log.error("Post not found with id: {}", postId);
      throw new AppException(ErrorCode.POST_NOT_FOUND);
    });
    GetPostResponse getPostResponse = postMapper.toGetPostResponse(post);
    getPostResponse.setCreatedAt(
        utils.convertInstantToString(post.getCreatedAt()));
    return getPostResponse;
  }
}

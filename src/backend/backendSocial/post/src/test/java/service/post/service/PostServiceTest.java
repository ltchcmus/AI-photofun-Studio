package service.post.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.multipart.MultipartFile;
import service.post.DTOs.HttpResponse;
import service.post.DTOs.request.CreatePostRequest;
import service.post.DTOs.request.CreateVideoPostRequest;
import service.post.DTOs.response.CreatePostResponse;
import service.post.DTOs.response.GetPostResponse;
import service.post.DTOs.response.PageResponse;
import service.post.DTOs.response.file.UploadFileResponse;
import service.post.DTOs.response.file.UploadVideoResponse;
import service.post.entity.Post;
import service.post.exception.AppException;
import service.post.exception.ErrorCode;
import service.post.mapper.PostMapper;
import service.post.repository.PostRepository;
import service.post.repository.http.FileClient;
import service.post.utils.Utils;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("PostService Unit Tests")
class PostServiceTest {

  @Mock private FileClient fileClient;
  @Mock private PostRepository postRepository;
  @Mock private PostMapper postMapper;
  @Mock private Utils utils;
  @Mock private SecurityContext securityContext;
  @Mock private Authentication authentication;
  @Mock private MultipartFile mockFile;

  @InjectMocks private PostService postService;

  private Post testPost;
  private static final String TEST_USER_ID = "test-user-123";
  private static final String TEST_POST_ID = "test-post-uuid";
  private static final String TEST_CAPTION = "Test caption";
  private static final String TEST_IMAGE_URL = "https://example.com/image.jpg";
  private static final String TEST_PROMPT = "A beautiful sunset";

  @BeforeEach
  void setUp() {
    testPost = Post.builder()
        .postId(TEST_POST_ID)
        .userId(TEST_USER_ID)
        .caption(TEST_CAPTION)
        .imageUrl(TEST_IMAGE_URL)
        .prompt(TEST_PROMPT)
        .likes(0)
        .comments(0)
        .createdAt(Instant.now())
        .build();
  }

  private void setupSecurityContext() {
    when(securityContext.getAuthentication()).thenReturn(authentication);
    when(authentication.getName()).thenReturn(TEST_USER_ID);
    SecurityContextHolder.setContext(securityContext);
  }

  // ==================== Create Tests ====================
  @Nested
  @DisplayName("Create Post Tests")
  class CreateTests {

    @BeforeEach
    void setupAuth() {
      setupSecurityContext();
    }

    @Test
    @DisplayName("Should create post successfully")
    void create_Success() {
      // Arrange
      CreatePostRequest request = CreatePostRequest.builder()
          .image(mockFile)
          .caption(TEST_CAPTION)
          .prompt(TEST_PROMPT)
          .build();

      UploadFileResponse uploadResponse = UploadFileResponse.builder()
          .image(TEST_IMAGE_URL)
          .build();

      HttpResponse<UploadFileResponse> httpResponse = HttpResponse.<UploadFileResponse>builder()
          .code(1000)
          .result(uploadResponse)
          .build();

      CreatePostResponse expectedResponse = CreatePostResponse.builder()
          .postId(TEST_POST_ID)
          .userId(TEST_USER_ID)
          .caption(TEST_CAPTION)
          .imageUrl(TEST_IMAGE_URL)
          .build();

      when(fileClient.uploadFile(anyString(), eq(mockFile))).thenReturn(httpResponse);
      when(postRepository.save(any(Post.class))).thenReturn(testPost);
      when(postMapper.toCreatePostResponse(testPost)).thenReturn(expectedResponse);

      // Act
      CreatePostResponse response = postService.create(request);

      // Assert
      assertNotNull(response);
      assertEquals(TEST_POST_ID, response.getPostId());
      assertEquals(TEST_CAPTION, response.getCaption());
      verify(postRepository).save(any(Post.class));
    }

    @Test
    @DisplayName("Should throw exception when file upload fails")
    void create_FileUploadFails_ThrowsException() {
      // Arrange
      CreatePostRequest request = CreatePostRequest.builder()
          .image(mockFile)
          .caption(TEST_CAPTION)
          .build();

      HttpResponse<UploadFileResponse> httpResponse = HttpResponse.<UploadFileResponse>builder()
          .code(500)
          .build();

      when(fileClient.uploadFile(anyString(), eq(mockFile))).thenReturn(httpResponse);

      // Act & Assert
      AppException exception = assertThrows(AppException.class, 
          () -> postService.create(request));
      assertEquals(ErrorCode.DONT_CREATE_POST, exception.getErrorCode());
    }
  }

  // ==================== GetAll Tests ====================
  @Nested
  @DisplayName("GetAll Tests")
  class GetAllTests {

    @Test
    @DisplayName("Should get all posts with pagination")
    void getAll_Success() {
      // Arrange
      int page = 0;
      int size = 10;
      List<Post> posts = List.of(testPost);
      Page<Post> postPage = new PageImpl<>(posts, PageRequest.of(page, size), 1);

      GetPostResponse getPostResponse = GetPostResponse.builder()
          .postId(TEST_POST_ID)
          .userId(TEST_USER_ID)
          .caption(TEST_CAPTION)
          .likes(0)
          .build();

      when(postRepository.findAll(any(Pageable.class))).thenReturn(postPage);
      when(postMapper.toGetPostResponse(testPost)).thenReturn(getPostResponse);
      when(utils.convertInstantToString(any(Instant.class))).thenReturn("2024-01-01 12:00:00");

      // Act
      PageResponse<GetPostResponse> response = postService.getAll(page, size);

      // Assert
      assertNotNull(response);
      assertEquals(1, response.getTotalElements());
      assertEquals(1, response.getElements().size());
      assertEquals(TEST_POST_ID, response.getElements().get(0).getPostId());
    }

    @Test
    @DisplayName("Should return empty page when no posts")
    void getAll_Empty() {
      // Arrange
      int page = 0;
      int size = 10;
      Page<Post> emptyPage = new PageImpl<>(List.of(), PageRequest.of(page, size), 0);

      when(postRepository.findAll(any(Pageable.class))).thenReturn(emptyPage);

      // Act
      PageResponse<GetPostResponse> response = postService.getAll(page, size);

      // Assert
      assertNotNull(response);
      assertEquals(0, response.getTotalElements());
      assertTrue(response.getElements().isEmpty());
    }
  }

  // ==================== GetAllByUserId Tests ====================
  @Nested
  @DisplayName("GetAllByUserId Tests")
  class GetAllByUserIdTests {

    @BeforeEach
    void setupAuth() {
      setupSecurityContext();
    }

    @Test
    @DisplayName("Should get posts by user ID with pagination")
    void getAllByUserId_Success() {
      // Arrange
      int page = 0;
      int size = 10;
      List<Post> posts = List.of(testPost);
      Page<Post> postPage = new PageImpl<>(posts, PageRequest.of(page, size), 1);

      GetPostResponse getPostResponse = GetPostResponse.builder()
          .postId(TEST_POST_ID)
          .userId(TEST_USER_ID)
          .caption(TEST_CAPTION)
          .build();

      when(postRepository.findAllByUserId(eq(TEST_USER_ID), any(Pageable.class)))
          .thenReturn(postPage);
      when(postMapper.toGetPostResponse(testPost)).thenReturn(getPostResponse);
      when(utils.convertInstantToString(any(Instant.class))).thenReturn("2024-01-01 12:00:00");

      // Act
      PageResponse<GetPostResponse> response = postService.getAllByUserId(page, size);

      // Assert
      assertNotNull(response);
      assertEquals(1, response.getTotalElements());
      assertEquals(TEST_POST_ID, response.getElements().get(0).getPostId());
    }
  }

  // ==================== ViewPost Tests ====================
  @Nested
  @DisplayName("ViewPost Tests")
  class ViewPostTests {

    @BeforeEach
    void setupAuth() {
      setupSecurityContext();
    }

    @Test
    @DisplayName("Should view post successfully")
    void viewPost_Success() {
      // Arrange
      GetPostResponse expectedResponse = GetPostResponse.builder()
          .postId(TEST_POST_ID)
          .userId(TEST_USER_ID)
          .caption(TEST_CAPTION)
          .imageUrl(TEST_IMAGE_URL)
          .build();

      when(postRepository.findById(TEST_POST_ID)).thenReturn(Optional.of(testPost));
      when(postMapper.toGetPostResponse(testPost)).thenReturn(expectedResponse);
      when(utils.convertInstantToString(any(Instant.class))).thenReturn("2024-01-01 12:00:00");

      // Act
      GetPostResponse response = postService.viewPost(TEST_POST_ID);

      // Assert
      assertNotNull(response);
      assertEquals(TEST_POST_ID, response.getPostId());
      assertEquals(TEST_CAPTION, response.getCaption());
    }

    @Test
    @DisplayName("Should throw exception when post not found")
    void viewPost_NotFound_ThrowsException() {
      // Arrange
      when(postRepository.findById(TEST_POST_ID)).thenReturn(Optional.empty());

      // Act & Assert
      AppException exception = assertThrows(AppException.class, 
          () -> postService.viewPost(TEST_POST_ID));
      assertEquals(ErrorCode.POST_NOT_FOUND, exception.getErrorCode());
    }
  }

  // ==================== LikePost Tests ====================
  @Nested
  @DisplayName("LikePost Tests")
  class LikePostTests {

    @BeforeEach
    void setupAuth() {
      setupSecurityContext();
    }

    @Test
    @DisplayName("Should like post successfully")
    void likePost_Success() {
      // Arrange
      when(postRepository.addNumberLikes(TEST_POST_ID, 1)).thenReturn(1);

      // Act & Assert
      assertDoesNotThrow(() -> postService.likePost(TEST_POST_ID, 1));
      verify(postRepository).addNumberLikes(TEST_POST_ID, 1);
    }

    @Test
    @DisplayName("Should unlike post (decrement) successfully")
    void likePost_Unlike_Success() {
      // Arrange
      when(postRepository.addNumberLikes(TEST_POST_ID, -1)).thenReturn(1);

      // Act & Assert
      assertDoesNotThrow(() -> postService.likePost(TEST_POST_ID, -1));
      verify(postRepository).addNumberLikes(TEST_POST_ID, -1);
    }

    @Test
    @DisplayName("Should throw exception when post not found")
    void likePost_NotFound_ThrowsException() {
      // Arrange
      when(postRepository.addNumberLikes(TEST_POST_ID, 1)).thenReturn(0);

      // Act & Assert
      AppException exception = assertThrows(AppException.class, 
          () -> postService.likePost(TEST_POST_ID, 1));
      assertEquals(ErrorCode.POST_NOT_FOUND, exception.getErrorCode());
    }
  }

  // ==================== UpdateCommentCount Tests ====================
  @Nested
  @DisplayName("UpdateCommentCount Tests")
  class UpdateCommentCountTests {

    @Test
    @DisplayName("Should update comment count successfully")
    void updateCommentCount_Success() {
      // Arrange
      when(postRepository.addNumberComments(TEST_POST_ID, 1)).thenReturn(1);

      // Act & Assert
      assertDoesNotThrow(() -> postService.updateCommentCount(TEST_POST_ID, 1));
      verify(postRepository).addNumberComments(TEST_POST_ID, 1);
    }

    @Test
    @DisplayName("Should decrement comment count successfully")
    void updateCommentCount_Decrement_Success() {
      // Arrange
      when(postRepository.addNumberComments(TEST_POST_ID, -1)).thenReturn(1);

      // Act & Assert
      assertDoesNotThrow(() -> postService.updateCommentCount(TEST_POST_ID, -1));
      verify(postRepository).addNumberComments(TEST_POST_ID, -1);
    }

    @Test
    @DisplayName("Should throw exception when post not found")
    void updateCommentCount_NotFound_ThrowsException() {
      // Arrange
      when(postRepository.addNumberComments(TEST_POST_ID, 1)).thenReturn(0);

      // Act & Assert
      AppException exception = assertThrows(AppException.class, 
          () -> postService.updateCommentCount(TEST_POST_ID, 1));
      assertEquals(ErrorCode.POST_NOT_FOUND, exception.getErrorCode());
    }
  }

  // ==================== UploadVideo Tests ====================
  @Nested
  @DisplayName("UploadVideo Tests")
  class UploadVideoTests {

    @BeforeEach
    void setupAuth() {
      setupSecurityContext();
    }

    @Test
    @DisplayName("Should upload video post successfully")
    void uploadVideo_Success() {
      // Arrange
      String videoUrl = "https://example.com/video.mp4";
      CreateVideoPostRequest request = CreateVideoPostRequest.builder()
          .videoUrl(videoUrl)
          .caption(TEST_CAPTION)
          .prompt(TEST_PROMPT)
          .build();

      UploadVideoResponse uploadResponse = UploadVideoResponse.builder()
          .video("https://storage.example.com/video.mp4")
          .build();

      HttpResponse<UploadVideoResponse> httpResponse = HttpResponse.<UploadVideoResponse>builder()
          .code(1000)
          .result(uploadResponse)
          .build();

      Post videoPost = Post.builder()
          .postId(TEST_POST_ID)
          .userId(TEST_USER_ID)
          .caption(TEST_CAPTION)
          .videoUrl("https://storage.example.com/video.mp4")
          .prompt(TEST_PROMPT)
          .build();

      CreatePostResponse expectedResponse = CreatePostResponse.builder()
          .postId(TEST_POST_ID)
          .userId(TEST_USER_ID)
          .caption(TEST_CAPTION)
          .build();

      when(fileClient.uploadVideoFile(anyString(), eq(videoUrl))).thenReturn(httpResponse);
      when(postRepository.save(any(Post.class))).thenReturn(videoPost);
      when(postMapper.toCreatePostResponse(videoPost)).thenReturn(expectedResponse);

      // Act
      CreatePostResponse response = postService.uploadVideo(request);

      // Assert
      assertNotNull(response);
      assertEquals(TEST_POST_ID, response.getPostId());
      verify(postRepository).save(any(Post.class));
    }

    @Test
    @DisplayName("Should throw exception when video upload fails")
    void uploadVideo_UploadFails_ThrowsException() {
      // Arrange
      CreateVideoPostRequest request = CreateVideoPostRequest.builder()
          .videoUrl("https://example.com/video.mp4")
          .caption(TEST_CAPTION)
          .build();

      HttpResponse<UploadVideoResponse> httpResponse = HttpResponse.<UploadVideoResponse>builder()
          .code(500)
          .build();

      when(fileClient.uploadVideoFile(anyString(), anyString())).thenReturn(httpResponse);

      // Act & Assert
      AppException exception = assertThrows(AppException.class, 
          () -> postService.uploadVideo(request));
      assertEquals(ErrorCode.DONT_CREATE_POST, exception.getErrorCode());
    }
  }
}

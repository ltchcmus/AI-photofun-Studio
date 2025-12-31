package service.identity.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import jakarta.persistence.EntityManager;
import java.util.*;
import java.util.concurrent.locks.ReentrantLock;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import service.identity.DTOs.HttpResponse;
import service.identity.DTOs.request.ChangePasswordRequest;
import service.identity.DTOs.request.ModifyUserTokenRequest;
import service.identity.DTOs.request.RegisterUserRequest;
import service.identity.DTOs.request.SetPasswordRequest;
import service.identity.DTOs.response.GetMeResponse;
import service.identity.DTOs.response.GetUserResponse;
import service.identity.DTOs.response.GetUserTokensResponse;
import service.identity.DTOs.response.RegisterUserResponse;
import service.identity.DTOs.response.RoleResponse;
import service.identity.entity.LimitRegister;
import service.identity.entity.Role;
import service.identity.entity.User;
import service.identity.exception.AppException;
import service.identity.exception.ErrorCode;
import service.identity.helper.MapperHelper;
import service.identity.mapper.UserMapper;
import service.identity.repository.LikeRepository;
import service.identity.repository.LimitRegisterRepository;
import service.identity.repository.UserRepository;
import service.identity.repository.http.FileClient;
import service.identity.repository.http.MailClient;
import service.identity.repository.http.PostClient;
import service.identity.repository.http.ProfileClient;
import service.identity.utils.Utils;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("UserService Unit Tests")
class UserServiceTest {

  @Mock private UserRepository userRepository;
  @Mock private LikeRepository likeRepository;
  @Mock private MapperHelper mapperHelper;
  @Mock private UserMapper userMapper;
  @Mock private FileClient fileClient;
  @Mock private PasswordEncoder passwordEncoder;
  @Mock private ProfileClient profileClient;
  @Mock private Utils utils;
  @Mock private MailClient mailClient;
  @Mock private PostClient postClient;
  @Mock private LimitRegisterRepository limitRegisterRepository;
  @Mock private EntityManager entityManager;
  @Mock private SecurityContext securityContext;
  @Mock private Authentication authentication;

  @InjectMocks private UserService userService;

  private User testUser;
  private static final String TEST_USER_ID = "test-user-123";
  private static final String TEST_USERNAME = "testuser";
  private static final String TEST_EMAIL = "test@example.com";
  private static final String TEST_PASSWORD = "password123";
  private static final String ENCODED_PASSWORD = "encodedPassword123";

  @BeforeEach
  void setUp() {
    // Setup default test user
    testUser = User.builder()
        .userId(TEST_USER_ID)
        .username(TEST_USERNAME)
        .email(TEST_EMAIL)
        .password(ENCODED_PASSWORD)
        .roles(new HashSet<>(Set.of(Role.builder().roleName("USER").build())))
        .tokens(1000)
        .loginByGoogle(false)
        .memberRequests(new ArrayList<>())
        .groupsJoined(new ArrayList<>())
        .build();

    // Set the limitAccountPerIp value using reflection
    ReflectionTestUtils.setField(userService, "limitAccountPerIp", 5);
    // Set the entityManager using reflection
    ReflectionTestUtils.setField(userService, "entityManager", entityManager);
  }

  private void setupSecurityContext() {
    when(securityContext.getAuthentication()).thenReturn(authentication);
    when(authentication.getName()).thenReturn(TEST_USER_ID);
    SecurityContextHolder.setContext(securityContext);
  }

  // ==================== Register Tests ====================
  @Nested
  @DisplayName("Register User Tests")
  class RegisterTests {

    @Test
    @DisplayName("Should register user successfully")
    void register_Success() {
      // Arrange
      RegisterUserRequest request = RegisterUserRequest.builder()
          .username(TEST_USERNAME)
          .email(TEST_EMAIL)
          .password(TEST_PASSWORD)
          .confirmPass(TEST_PASSWORD)
          .fullName("Test User")
          .build();

      LimitRegister limitRegister = LimitRegister.builder()
          .clientIp("127.0.0.1")
          .registerCount(0)
          .build();

      RegisterUserResponse expectedResponse = RegisterUserResponse.builder()
          .userId(TEST_USER_ID)
          .username(TEST_USERNAME)
          .email(TEST_EMAIL)
          .build();

      when(limitRegisterRepository.findById(anyString())).thenReturn(Optional.of(limitRegister));
      when(userRepository.existsByUsername(TEST_USERNAME)).thenReturn(false);
      when(userRepository.existsByEmail(TEST_EMAIL)).thenReturn(false);
      when(userMapper.toUser(request)).thenReturn(testUser);
      when(passwordEncoder.encode(anyString())).thenReturn(ENCODED_PASSWORD);
      when(mapperHelper.mapRoleFromStrings(anySet())).thenReturn(testUser.getRoles());
      when(userRepository.save(any(User.class))).thenReturn(testUser);
      when(userMapper.toRegisterUserResponse(testUser)).thenReturn(expectedResponse);
      when(mapperHelper.mapRoleResponseFromRole(anySet())).thenReturn(Set.of(new RoleResponse()));
      when(utils.Welcome(anyString())).thenReturn("Welcome!");

      // Act
      RegisterUserResponse response = userService.register(request, "127.0.0.1");

      // Assert
      assertNotNull(response);
      assertEquals(TEST_USER_ID, response.getUserId());
      assertEquals(TEST_USERNAME, response.getUsername());
      verify(userRepository).save(any(User.class));
      verify(profileClient).create(any());
      verify(mailClient).sendMail(any());
    }

    @Test
    @DisplayName("Should throw exception when passwords don't match")
    void register_PasswordsMismatch_ThrowsException() {
      // Arrange
      RegisterUserRequest request = RegisterUserRequest.builder()
          .username(TEST_USERNAME)
          .email(TEST_EMAIL)
          .password(TEST_PASSWORD)
          .confirmPass("differentPassword")
          .build();

      LimitRegister limitRegister = LimitRegister.builder()
          .clientIp("127.0.0.1")
          .registerCount(0)
          .build();

      when(limitRegisterRepository.findById(anyString())).thenReturn(Optional.of(limitRegister));

      // Act & Assert
      AppException exception = assertThrows(AppException.class, 
          () -> userService.register(request, "127.0.0.1"));
      assertEquals(ErrorCode.PASSWORDS_DO_NOT_MATCH, exception.getErrorCode());
    }

    @Test
    @DisplayName("Should throw exception when username already exists")
    void register_UsernameExists_ThrowsException() {
      // Arrange
      RegisterUserRequest request = RegisterUserRequest.builder()
          .username(TEST_USERNAME)
          .email(TEST_EMAIL)
          .password(TEST_PASSWORD)
          .confirmPass(TEST_PASSWORD)
          .build();

      LimitRegister limitRegister = LimitRegister.builder()
          .clientIp("127.0.0.1")
          .registerCount(0)
          .build();

      when(limitRegisterRepository.findById(anyString())).thenReturn(Optional.of(limitRegister));
      when(userRepository.existsByUsername(TEST_USERNAME)).thenReturn(true);

      // Act & Assert
      AppException exception = assertThrows(AppException.class, 
          () -> userService.register(request, "127.0.0.1"));
      assertEquals(ErrorCode.USERNAME_ALREADY_EXISTS, exception.getErrorCode());
    }

    @Test
    @DisplayName("Should throw exception when limit register exceeded")
    void register_LimitExceeded_ThrowsException() {
      // Arrange
      RegisterUserRequest request = RegisterUserRequest.builder()
          .username(TEST_USERNAME)
          .email(TEST_EMAIL)
          .password(TEST_PASSWORD)
          .confirmPass(TEST_PASSWORD)
          .build();

      LimitRegister limitRegister = LimitRegister.builder()
          .clientIp("127.0.0.1")
          .registerCount(10) // Exceeds limit of 5
          .build();

      when(limitRegisterRepository.findById(anyString())).thenReturn(Optional.of(limitRegister));

      // Act & Assert
      AppException exception = assertThrows(AppException.class, 
          () -> userService.register(request, "127.0.0.1"));
      assertEquals(ErrorCode.LIMIT_REGISTER_EXCEEDED, exception.getErrorCode());
    }
  }

  // ==================== GetUserById Tests ====================
  @Nested
  @DisplayName("GetUserById Tests")
  class GetUserByIdTests {

    @Test
    @DisplayName("Should get user by ID successfully")
    void getUserById_Success() {
      // Arrange
      GetUserResponse expectedResponse = GetUserResponse.builder()
          .userId(TEST_USER_ID)
          .username(TEST_USERNAME)
          .email(TEST_EMAIL)
          .build();

      when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));
      when(userMapper.toGetUserResponse(testUser)).thenReturn(expectedResponse);
      when(mapperHelper.mapRoleResponseFromRole(anySet())).thenReturn(Set.of(new RoleResponse()));

      // Act
      GetUserResponse response = userService.getUserById(TEST_USER_ID);

      // Assert
      assertNotNull(response);
      assertEquals(TEST_USER_ID, response.getUserId());
      verify(entityManager).clear();
    }

    @Test
    @DisplayName("Should throw exception when user not found")
    void getUserById_NotFound_ThrowsException() {
      // Arrange
      when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.empty());

      // Act & Assert
      AppException exception = assertThrows(AppException.class, 
          () -> userService.getUserById(TEST_USER_ID));
      assertEquals(ErrorCode.USER_NOT_FOUND, exception.getErrorCode());
    }
  }

  // ==================== ChangePassword Tests ====================
  @Nested
  @DisplayName("ChangePassword Tests")
  class ChangePasswordTests {

    @BeforeEach
    void setupAuth() {
      setupSecurityContext();
    }

    @Test
    @DisplayName("Should change password successfully")
    void changePassword_Success() {
      // Arrange
      ChangePasswordRequest request = ChangePasswordRequest.builder()
          .oldPassword("oldPassword")
          .newPassword("newPassword123")
          .confirmNewPassword("newPassword123")
          .build();

      when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));
      when(passwordEncoder.matches("oldPassword", ENCODED_PASSWORD)).thenReturn(true);
      when(passwordEncoder.encode("newPassword123")).thenReturn("newEncodedPassword");

      // Act
      boolean result = userService.changePassword(request);

      // Assert
      assertTrue(result);
      verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Should throw exception when old password is incorrect")
    void changePassword_OldPasswordIncorrect_ThrowsException() {
      // Arrange
      ChangePasswordRequest request = ChangePasswordRequest.builder()
          .oldPassword("wrongPassword")
          .newPassword("newPassword123")
          .confirmNewPassword("newPassword123")
          .build();

      when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));
      when(passwordEncoder.matches("wrongPassword", ENCODED_PASSWORD)).thenReturn(false);

      // Act & Assert
      AppException exception = assertThrows(AppException.class, 
          () -> userService.changePassword(request));
      assertEquals(ErrorCode.OLD_PASSWORD_INCORRECT, exception.getErrorCode());
    }

    @Test
    @DisplayName("Should throw exception when new password same as old")
    void changePassword_SameAsOld_ThrowsException() {
      // Arrange
      ChangePasswordRequest request = ChangePasswordRequest.builder()
          .oldPassword("samePassword")
          .newPassword("samePassword")
          .confirmNewPassword("samePassword")
          .build();

      // Act & Assert
      AppException exception = assertThrows(AppException.class, 
          () -> userService.changePassword(request));
      assertEquals(ErrorCode.NEW_PASSWORD_SAME_AS_OLD, exception.getErrorCode());
    }

    @Test
    @DisplayName("Should throw exception when fields are blank")
    void changePassword_BlankFields_ThrowsException() {
      // Arrange
      ChangePasswordRequest request = ChangePasswordRequest.builder()
          .oldPassword("")
          .newPassword("newPassword")
          .confirmNewPassword("newPassword")
          .build();

      // Act & Assert
      AppException exception = assertThrows(AppException.class, 
          () -> userService.changePassword(request));
      assertEquals(ErrorCode.CANT_BE_BLANK, exception.getErrorCode());
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
    @DisplayName("Should like post successfully when not already liked")
    void likePost_NotLiked_Success() {
      // Arrange
      String postId = "post-123";
      when(userRepository.existsById(TEST_USER_ID)).thenReturn(true);
      when(likeRepository.existsByUserIdAndPostId(TEST_USER_ID, postId)).thenReturn(false);

      // Act
      userService.likePost(postId);

      // Assert
      verify(likeRepository).save(any());
      verify(postClient).likePost(postId, 1);
    }

    @Test
    @DisplayName("Should unlike post when already liked")
    void likePost_AlreadyLiked_Unlike() {
      // Arrange
      String postId = "post-123";
      when(userRepository.existsById(TEST_USER_ID)).thenReturn(true);
      when(likeRepository.existsByUserIdAndPostId(TEST_USER_ID, postId)).thenReturn(true);

      // Act
      userService.likePost(postId);

      // Assert
      verify(likeRepository).deleteByUserIdAndPostId(TEST_USER_ID, postId);
      verify(postClient).likePost(postId, -1);
    }

    @Test
    @DisplayName("Should throw exception when user not found")
    void likePost_UserNotFound_ThrowsException() {
      // Arrange
      String postId = "post-123";
      when(userRepository.existsById(TEST_USER_ID)).thenReturn(false);

      // Act & Assert
      AppException exception = assertThrows(AppException.class, 
          () -> userService.likePost(postId));
      assertEquals(ErrorCode.USER_NOT_FOUND, exception.getErrorCode());
    }
  }

  // ==================== GetUserTokens Tests ====================
  @Nested
  @DisplayName("GetUserTokens Tests")
  class GetUserTokensTests {

    @Test
    @DisplayName("Should get user tokens successfully")
    void getUserTokens_Success() {
      // Arrange
      when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));

      // Act
      GetUserTokensResponse response = userService.getUserTokens(TEST_USER_ID);

      // Assert
      assertNotNull(response);
      assertEquals(1000, response.getTokens());
    }

    @Test
    @DisplayName("Should throw exception when user not found")
    void getUserTokens_UserNotFound_ThrowsException() {
      // Arrange
      when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.empty());

      // Act & Assert
      AppException exception = assertThrows(AppException.class, 
          () -> userService.getUserTokens(TEST_USER_ID));
      assertEquals(ErrorCode.USER_NOT_FOUND, exception.getErrorCode());
    }
  }

  // ==================== ModifyUserTokens Tests ====================
  @Nested
  @DisplayName("ModifyUserTokens Tests")
  class ModifyUserTokensTests {

    @Test
    @DisplayName("Should modify user tokens successfully")
    void modifyUserTokens_Success() {
      // Arrange
      ModifyUserTokenRequest request = ModifyUserTokenRequest.builder()
          .userId(TEST_USER_ID)
          .tokens(100)
          .build();

      when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));

      // Act
      userService.modifyUserTokens(request);

      // Assert
      assertEquals(900, testUser.getTokens()); // 1000 - 100
      verify(userRepository).save(testUser);
    }
  }

  // ==================== SetPassword Tests ====================
  @Nested
  @DisplayName("SetPassword Tests")
  class SetPasswordTests {

    @BeforeEach
    void setupAuth() {
      setupSecurityContext();
    }

    @Test
    @DisplayName("Should set password for Google user successfully")
    void setPassword_GoogleUser_Success() {
      // Arrange
      testUser.setLoginByGoogle(true);
      SetPasswordRequest request = SetPasswordRequest.builder()
          .newPassword("newPassword123")
          .confirmPassword("newPassword123")
          .build();

      when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));
      when(passwordEncoder.encode("newPassword123")).thenReturn("encodedNewPassword");

      // Act
      boolean result = userService.setPassword(request);

      // Assert
      assertTrue(result);
      assertFalse(testUser.isLoginByGoogle());
      verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Should throw exception when non-Google user tries to set password")
    void setPassword_NonGoogleUser_ThrowsException() {
      // Arrange
      testUser.setLoginByGoogle(false);
      SetPasswordRequest request = SetPasswordRequest.builder()
          .newPassword("newPassword123")
          .confirmPassword("newPassword123")
          .build();

      when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));

      // Act & Assert
      AppException exception = assertThrows(AppException.class, 
          () -> userService.setPassword(request));
      assertEquals(ErrorCode.USER_ALREADY_SET_PASSWORD, exception.getErrorCode());
    }
  }

  // ==================== IsPremium Tests ====================
  @Nested
  @DisplayName("IsPremium Tests")
  class IsPremiumTests {

    @Test
    @DisplayName("Should return true when user has premium one month")
    void isPremium_PremiumOneMonth_ReturnsTrue() {
      // Arrange
      testUser.setPremiumOneMonth(true);
      when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));

      // Act
      boolean result = userService.isPremium(TEST_USER_ID);

      // Assert
      assertTrue(result);
    }

    @Test
    @DisplayName("Should return true when user has premium six months")
    void isPremium_PremiumSixMonths_ReturnsTrue() {
      // Arrange
      testUser.setPremiumSixMonths(true);
      when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));

      // Act
      boolean result = userService.isPremium(TEST_USER_ID);

      // Assert
      assertTrue(result);
    }

    @Test
    @DisplayName("Should return false when user has no premium")
    void isPremium_NoPremium_ReturnsFalse() {
      // Arrange
      testUser.setPremiumOneMonth(false);
      testUser.setPremiumSixMonths(false);
      when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));

      // Act
      boolean result = userService.isPremium(TEST_USER_ID);

      // Assert
      assertFalse(result);
    }
  }

  // ==================== Group Management Tests ====================
  @Nested
  @DisplayName("Group Management Tests")
  class GroupManagementTests {

    @Test
    @DisplayName("Should add group to user successfully")
    void addGroup_Success() {
      // Arrange
      String groupId = "group-123";
      when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));

      // Act
      userService.addGroup(groupId, TEST_USER_ID);

      // Assert
      assertTrue(testUser.getGroupsJoined().contains(groupId));
      verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Should not add duplicate group")
    void addGroup_DuplicateGroup_NotAdded() {
      // Arrange
      String groupId = "group-123";
      testUser.getGroupsJoined().add(groupId);
      when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));

      // Act
      userService.addGroup(groupId, TEST_USER_ID);

      // Assert
      assertEquals(1, testUser.getGroupsJoined().stream()
          .filter(g -> g.equals(groupId)).count());
    }

    @Test
    @DisplayName("Should remove group from user successfully")
    void removeGroup_Success() {
      // Arrange
      String groupId = "group-123";
      testUser.getGroupsJoined().add(groupId);
      when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));

      // Act
      userService.removeGroup(groupId, TEST_USER_ID);

      // Assert
      assertFalse(testUser.getGroupsJoined().contains(groupId));
      verify(userRepository).save(testUser);
    }
  }

  // ==================== CheckLikedPosts Tests ====================
  @Nested
  @DisplayName("CheckLikedPosts Tests")
  class CheckLikedPostsTests {

    @BeforeEach
    void setupAuth() {
      setupSecurityContext();
    }

    @Test
    @DisplayName("Should return map of liked posts")
    void checkLikedPosts_Success() {
      // Arrange
      String[] postIds = {"post-1", "post-2", "post-3"};
      List<String> likedPostIds = List.of("post-1", "post-3");

      when(userRepository.existsById(TEST_USER_ID)).thenReturn(true);
      when(likeRepository.findLikedPostIdsByUserIdAndPostIds(eq(TEST_USER_ID), anyList()))
          .thenReturn(likedPostIds);

      // Act
      Map<String, Boolean> result = userService.checkLikedPosts(postIds);

      // Assert
      assertNotNull(result);
      assertTrue(result.get("post-1"));
      assertFalse(result.get("post-2"));
      assertTrue(result.get("post-3"));
    }
  }
}

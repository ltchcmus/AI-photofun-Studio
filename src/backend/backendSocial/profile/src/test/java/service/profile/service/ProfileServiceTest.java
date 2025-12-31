package service.profile.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.io.IOException;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import service.profile.DTOs.request.ProfileCreateRequest;
import service.profile.DTOs.request.ProfileUpdateRequest;
import service.profile.DTOs.response.GetProfileResponse;
import service.profile.DTOs.response.ProfileCreateResponse;
import service.profile.DTOs.response.ProfileUpdateResponse;
import service.profile.entity.Profile;
import service.profile.exception.AppException;
import service.profile.exception.ErrorCode;
import service.profile.mapper.ProfileMapper;
import service.profile.repository.ProfileRepository;
import service.profile.repository.http.MailClient;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ProfileService Unit Tests")
class ProfileServiceTest {

  @Mock private ProfileRepository profileRepository;
  @Mock private ProfileMapper profileMapper;
  @Mock private MailClient mailClient;
  @Mock private SecurityContext securityContext;
  @Mock private Authentication authentication;

  @InjectMocks private ProfileService profileService;

  private Profile testProfile;
  private static final String TEST_USER_ID = "test-user-123";
  private static final String TEST_EMAIL = "test@example.com";
  private static final String TEST_FULL_NAME = "Test User";

  @BeforeEach
  void setUp() {
    testProfile = Profile.builder()
        .userId(TEST_USER_ID)
        .email(TEST_EMAIL)
        .fullName(TEST_FULL_NAME)
        .phone("0123456789")
        .verified(false)
        .code(0)
        .build();
  }

  private void setupSecurityContext() {
    when(securityContext.getAuthentication()).thenReturn(authentication);
    when(authentication.getName()).thenReturn(TEST_USER_ID);
    SecurityContextHolder.setContext(securityContext);
  }

  // ==================== Create Tests ====================
  @Nested
  @DisplayName("Create Profile Tests")
  class CreateTests {

    @Test
    @DisplayName("Should create profile successfully")
    void create_Success() {
      // Arrange
      ProfileCreateRequest request = ProfileCreateRequest.builder()
          .userId(TEST_USER_ID)
          .email(TEST_EMAIL)
          .fullName(TEST_FULL_NAME)
          .build();

      ProfileCreateResponse expectedResponse = ProfileCreateResponse.builder()
          .userId(TEST_USER_ID)
          .email(TEST_EMAIL)
          .fullName(TEST_FULL_NAME)
          .build();

      when(profileMapper.toProfile(request)).thenReturn(testProfile);
      when(profileRepository.save(testProfile)).thenReturn(testProfile);
      when(profileMapper.toProfileCreateResponse(testProfile)).thenReturn(expectedResponse);

      // Act
      ProfileCreateResponse response = profileService.create(request);

      // Assert
      assertNotNull(response);
      assertEquals(TEST_USER_ID, response.getUserId());
      assertEquals(TEST_EMAIL, response.getEmail());
      verify(profileRepository).save(any(Profile.class));
    }
  }

  // ==================== GetById Tests ====================
  @Nested
  @DisplayName("GetById Tests")
  class GetByIdTests {

    @BeforeEach
    void setupAuth() {
      setupSecurityContext();
    }

    @Test
    @DisplayName("Should get profile by ID successfully")
    void getById_Success() {
      // Arrange
      GetProfileResponse expectedResponse = GetProfileResponse.builder()
          .email(TEST_EMAIL)
          .fullName(TEST_FULL_NAME)
          .build();

      when(profileRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testProfile));
      when(profileMapper.toGetProfileResponse(testProfile)).thenReturn(expectedResponse);

      // Act
      GetProfileResponse response = profileService.getById();

      // Assert
      assertNotNull(response);
      assertEquals(TEST_EMAIL, response.getEmail());
    }

    @Test
    @DisplayName("Should throw exception when profile not found")
    void getById_NotFound_ThrowsException() {
      // Arrange
      when(profileRepository.findById(TEST_USER_ID)).thenReturn(Optional.empty());

      // Act & Assert
      AppException exception = assertThrows(AppException.class, 
          () -> profileService.getById());
      assertEquals(ErrorCode.PROFILE_NOT_FOUND, exception.getErrorCode());
    }
  }

  // ==================== GetAll Tests ====================
  @Nested
  @DisplayName("GetAll Tests")
  class GetAllTests {

    @Test
    @DisplayName("Should get all profiles successfully")
    void getAll_Success() {
      // Arrange
      Profile profile2 = Profile.builder()
          .userId("user-2")
          .email("user2@example.com")
          .fullName("User 2")
          .build();

      List<Profile> profiles = List.of(testProfile, profile2);

      GetProfileResponse response1 = GetProfileResponse.builder()
          .email(TEST_EMAIL)
          .build();

      GetProfileResponse response2 = GetProfileResponse.builder()
          .email("user2@example.com")
          .build();

      when(profileRepository.findAll()).thenReturn(profiles);
      when(profileMapper.toGetProfileResponse(testProfile)).thenReturn(response1);
      when(profileMapper.toGetProfileResponse(profile2)).thenReturn(response2);

      // Act
      List<GetProfileResponse> result = profileService.getAll();

      // Assert
      assertNotNull(result);
      assertEquals(2, result.size());
    }

    @Test
    @DisplayName("Should return empty list when no profiles")
    void getAll_Empty() {
      // Arrange
      when(profileRepository.findAll()).thenReturn(List.of());

      // Act
      List<GetProfileResponse> result = profileService.getAll();

      // Assert
      assertNotNull(result);
      assertTrue(result.isEmpty());
    }
  }

  // ==================== Update Tests ====================
  @Nested
  @DisplayName("Update Profile Tests")
  class UpdateTests {

    @BeforeEach
    void setupAuth() {
      setupSecurityContext();
    }

    @Test
    @DisplayName("Should update profile successfully")
    void update_Success() {
      // Arrange
      ProfileUpdateRequest request = ProfileUpdateRequest.builder()
          .fullName("Updated Name")
          .phone("0987654321")
          .email("updated@example.com")
          .build();

      ProfileUpdateResponse expectedResponse = ProfileUpdateResponse.builder()
          .fullName("Updated Name")
          .phone("0987654321")
          .email("updated@example.com")
          .build();

      when(profileRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testProfile));
      when(profileMapper.toProfileUpdateResponse(any(Profile.class))).thenReturn(expectedResponse);

      // Act
      ProfileUpdateResponse response = profileService.update(request);

      // Assert
      assertNotNull(response);
      assertEquals("Updated Name", response.getFullName());
      verify(profileRepository).save(any(Profile.class));
    }

    @Test
    @DisplayName("Should update only provided fields")
    void update_PartialUpdate_Success() {
      // Arrange
      ProfileUpdateRequest request = ProfileUpdateRequest.builder()
          .fullName("Only Name Updated")
          .build();

      ProfileUpdateResponse expectedResponse = ProfileUpdateResponse.builder()
          .fullName("Only Name Updated")
          .phone("0123456789") // Original phone
          .email(TEST_EMAIL)   // Original email
          .build();

      when(profileRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testProfile));
      when(profileMapper.toProfileUpdateResponse(any(Profile.class))).thenReturn(expectedResponse);

      // Act
      ProfileUpdateResponse response = profileService.update(request);

      // Assert
      assertNotNull(response);
      assertEquals("Only Name Updated", response.getFullName());
      assertEquals("0123456789", response.getPhone());
    }

    @Test
    @DisplayName("Should throw exception when profile not found")
    void update_NotFound_ThrowsException() {
      // Arrange
      ProfileUpdateRequest request = ProfileUpdateRequest.builder()
          .fullName("Updated Name")
          .build();

      when(profileRepository.findById(TEST_USER_ID)).thenReturn(Optional.empty());

      // Act & Assert
      AppException exception = assertThrows(AppException.class, 
          () -> profileService.update(request));
      assertEquals(ErrorCode.PROFILE_NOT_FOUND, exception.getErrorCode());
    }
  }

  // ==================== Delete Tests ====================
  @Nested
  @DisplayName("Delete Profile Tests")
  class DeleteTests {

    @Test
    @DisplayName("Should delete profile successfully")
    void delete_Success() {
      // Arrange
      when(profileRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testProfile));

      // Act
      profileService.delete(TEST_USER_ID);

      // Assert
      verify(profileRepository).delete(testProfile);
    }

    @Test
    @DisplayName("Should throw exception when profile not found")
    void delete_NotFound_ThrowsException() {
      // Arrange
      when(profileRepository.findById(TEST_USER_ID)).thenReturn(Optional.empty());

      // Act & Assert
      AppException exception = assertThrows(AppException.class, 
          () -> profileService.delete(TEST_USER_ID));
      assertEquals(ErrorCode.PROFILE_NOT_FOUND, exception.getErrorCode());
    }
  }

  // ==================== CheckVerify Tests ====================
  @Nested
  @DisplayName("CheckVerify Tests")
  class CheckVerifyTests {

    @BeforeEach
    void setupAuth() {
      setupSecurityContext();
    }

    @Test
    @DisplayName("Should return true when profile is verified")
    void checkVerify_Verified_ReturnsTrue() {
      // Arrange
      testProfile.setVerified(true);
      when(profileRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testProfile));

      // Act
      boolean result = profileService.checkVerify();

      // Assert
      assertTrue(result);
    }

    @Test
    @DisplayName("Should return false when profile is not verified")
    void checkVerify_NotVerified_ReturnsFalse() {
      // Arrange
      testProfile.setVerified(false);
      when(profileRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testProfile));

      // Act
      boolean result = profileService.checkVerify();

      // Assert
      assertFalse(result);
    }

    @Test
    @DisplayName("Should throw exception when profile not found")
    void checkVerify_NotFound_ThrowsException() {
      // Arrange
      when(profileRepository.findById(TEST_USER_ID)).thenReturn(Optional.empty());

      // Act & Assert
      AppException exception = assertThrows(AppException.class, 
          () -> profileService.checkVerify());
      assertEquals(ErrorCode.PROFILE_NOT_FOUND, exception.getErrorCode());
    }
  }

  // ==================== ActivateProfile Tests ====================
  @Nested
  @DisplayName("ActivateProfile Tests")
  class ActivateProfileTests {

    @BeforeEach
    void setupAuth() {
      setupSecurityContext();
    }

    @Test
    @DisplayName("Should activate profile with correct code")
    void activateProfile_CorrectCode_Success() {
      // Arrange
      int verificationCode = 1234;
      testProfile.setCode(verificationCode);
      when(profileRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testProfile));

      // Act
      boolean result = profileService.activateProfile(verificationCode);

      // Assert
      assertTrue(result);
      assertTrue(testProfile.isVerified());
      verify(profileRepository).save(testProfile);
    }

    @Test
    @DisplayName("Should throw exception with incorrect code")
    void activateProfile_IncorrectCode_ThrowsException() {
      // Arrange
      testProfile.setCode(1234);
      when(profileRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testProfile));

      // Act & Assert
      AppException exception = assertThrows(AppException.class, 
          () -> profileService.activateProfile(9999)); // Wrong code
      assertEquals(ErrorCode.CODE_INVALID, exception.getErrorCode());
    }

    @Test
    @DisplayName("Should throw exception when profile not found")
    void activateProfile_NotFound_ThrowsException() {
      // Arrange
      when(profileRepository.findById(TEST_USER_ID)).thenReturn(Optional.empty());

      // Act & Assert
      AppException exception = assertThrows(AppException.class, 
          () -> profileService.activateProfile(1234));
      assertEquals(ErrorCode.PROFILE_NOT_FOUND, exception.getErrorCode());
    }
  }
}

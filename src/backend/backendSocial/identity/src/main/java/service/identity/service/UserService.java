package service.identity.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.locks.ReentrantLock;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.util.Pair;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import service.identity.DTOs.HttpResponse;
import service.identity.DTOs.request.ChangePasswordRequest;
import service.identity.DTOs.request.ModifyUserTokenRequest;
import service.identity.DTOs.request.RegisterUserRequest;
import service.identity.DTOs.request.SetPasswordRequest;
import service.identity.DTOs.request.mail.SendMailRequest;
import service.identity.DTOs.request.profile.ProfileCreateRequest;
import service.identity.DTOs.response.*;
import service.identity.DTOs.response.file.UploadFileResponse;
import service.identity.entity.Like;
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

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class UserService {
  UserRepository userRepository;
  LikeRepository likeRepository;
  MapperHelper mapperHelper;
  UserMapper userMapper;
  FileClient fileClient;
  PasswordEncoder passwordEncoder;
  ProfileClient profileClient;
  Utils utils;
  MailClient mailClient;
  PostClient postClient;
  LimitRegisterRepository limitRegisterRepository;

  @NonFinal @PersistenceContext EntityManager entityManager;

  @NonFinal ReentrantLock lock = new ReentrantLock();

  @NonFinal @Value("${config.env.limit-account-per-ip}") int limitAccountPerIp;

  public RegisterUserResponse register(RegisterUserRequest registerUserRequest,
                                       String clientIp) {

    if (limitAccountPerIp <= 0)
      limitAccountPerIp = 5;

    String finalClientIp = clientIp;
    LimitRegister limitRegister =
        limitRegisterRepository.findById(clientIp).orElseGet(
            ()
                -> LimitRegister.builder()
                       .clientIp(finalClientIp)
                       .registerCount(0)
                       .build());
    if (limitRegister.getRegisterCount() >= limitAccountPerIp) {
      throw new AppException(ErrorCode.LIMIT_REGISTER_EXCEEDED);
    }

    limitRegister.setRegisterCount(limitRegister.getRegisterCount() + 1);
    try {
      limitRegisterRepository.save(limitRegister);
    } catch (DataIntegrityViolationException de) {
      throw new RuntimeException(de.getMessage());
    } catch (Exception e) {
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    }

    if (!registerUserRequest.getConfirmPass().equals(
            registerUserRequest.getPassword())) {
      throw new AppException(ErrorCode.PASSWORDS_DO_NOT_MATCH);
    }

    if (userRepository.existsByUsername(registerUserRequest.getUsername())) {
      throw new AppException(ErrorCode.USERNAME_ALREADY_EXISTS);
    }
    if (userRepository.existsByEmail(registerUserRequest.getEmail())) {
      throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
    }

    User user = userMapper.toUser(registerUserRequest);
    user.setPassword(passwordEncoder.encode(user.getPassword()));

    Set<String> roleStrings = new HashSet<>(List.of("USER"));
    if (registerUserRequest.getRoles() != null) {
      roleStrings.addAll(registerUserRequest.getRoles());
    }
    Set<Role> roles = mapperHelper.mapRoleFromStrings(roleStrings);
    // roles.add(utils.getRoleDefault());
    user.setRoles(roles);

    User savedUser = userRepository.save(user);

    RegisterUserResponse response =
        userMapper.toRegisterUserResponse(savedUser);
    response.setRoles(
        mapperHelper.mapRoleResponseFromRole(savedUser.getRoles()));

    ProfileCreateRequest profileCreateRequest =
        ProfileCreateRequest.builder()
            .email(response.getEmail())
            .userId(response.getUserId())
            .fullName(registerUserRequest.getFullName())
            .build();

    try {
      profileClient.create(profileCreateRequest);
    } catch (Exception e) {
      log.error("Error creating profile for user {}: {}", response.getUserId(),
                e.getMessage());
      userRepository.delete(user);
      throw new AppException(ErrorCode.FAILED_TO_CREATE_PROFILE);
    }

    String content = utils.Welcome(savedUser.getUsername());
    mailClient.sendMail(SendMailRequest.builder()
                            .toEmail(savedUser.getEmail())
                            .content(content)
                            .toName(savedUser.getUsername())
                            .subject("Welcome to Our App AI PhotoFun Studio!")
                            .build());
    return response;
  }

  @PostAuthorize(
      "returnObject.userId == authentication.name or hasRole('ADMIN')")
  public GetUserResponse
  getUserById(String userId) {
    // Clear cache to ensure fresh data from DB
    entityManager.clear();
    User user = userRepository.findById(userId).orElseThrow(
        () -> new AppException(ErrorCode.USER_NOT_FOUND));

    GetUserResponse response = userMapper.toGetUserResponse(user);
    response.setRoles(mapperHelper.mapRoleResponseFromRole(user.getRoles()));
    return response;
  }

  @PreAuthorize("hasRole('ADMIN')")
  public List<GetUserResponse> getAllUsers() {
    // Clear cache to ensure fresh data from DB
    entityManager.clear();
    List<User> users = userRepository.findAll();
    return users.stream()
        .map(user -> {
          GetUserResponse response = userMapper.toGetUserResponse(user);
          response.setRoles(
              mapperHelper.mapRoleResponseFromRole(user.getRoles()));
          return response;
        })
        .toList();
  }

  @PostAuthorize(
      "returnObject.userId == authentication.name or hasRole('ADMIN')")
  public GetMeResponse
  getMe() {
    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();
    User user = userRepository.findById(userId).orElseThrow(
        () -> new AppException(ErrorCode.USER_NOT_FOUND));
    return userMapper.toGetMeResponse(user);
  }

  @PreAuthorize("isAuthenticated()")
  public boolean changePassword(ChangePasswordRequest changePasswordRequest) {
    String oldPassword = changePasswordRequest.getOldPassword();
    String newPassword = changePasswordRequest.getNewPassword();
    String confirmPassword = changePasswordRequest.getConfirmNewPassword();

    if (newPassword == null || newPassword.isEmpty() ||
        confirmPassword == null || confirmPassword.isEmpty() ||
        oldPassword == null || oldPassword.isEmpty()) {
      throw new AppException(ErrorCode.CANT_BE_BLANK);
    }

    if (!newPassword.equals(confirmPassword)) {
      throw new AppException(ErrorCode.PASSWORDS_DO_NOT_MATCH);
    }

    if (newPassword.equals(oldPassword)) {
      throw new AppException(ErrorCode.NEW_PASSWORD_SAME_AS_OLD);
    }

    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();

    lock.lock();
    try {
      User user = userRepository.findById(userId).orElseThrow(
          () -> new AppException(ErrorCode.USER_NOT_FOUND));

      log.info("Changing password for user with userId = {}", user.getUserId());
      log.info("Changing password for user with username = {}",
               user.getUsername());

      // Verify old password matches current password in database
      if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
        throw new AppException(ErrorCode.OLD_PASSWORD_INCORRECT);
      }

      user.setPassword(passwordEncoder.encode(newPassword));
      userRepository.save(user);
      return true;
    } finally {
      lock.unlock();
    }
  }

  @PreAuthorize("isAuthenticated()")
  public UploadAvatarResponse uploadAvatar(MultipartFile file) {
    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();
    HttpResponse<UploadFileResponse> response =
        fileClient.uploadFile(userId, file);
    if (response.getCode() != 1000) {
      throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
    }
    String avatarUrl = response.getResult().getImage();

    UploadAvatarResponse avatarResponse =
        UploadAvatarResponse.builder().avatarUrl(avatarUrl).build();

    lock.lock();
    try {
      User user = userRepository.findById(userId).orElseThrow(
          () -> new AppException(ErrorCode.USER_NOT_FOUND));
      user.setAvatarUrl(avatarUrl);
      userRepository.save(user);
      return avatarResponse;
    } finally {
      lock.unlock();
    }
  }

  @Transactional
  @PreAuthorize("isAuthenticated()")
  public void likePost(String postId) {
    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();

    // Check if user exists
    if (!userRepository.existsById(userId)) {
      throw new AppException(ErrorCode.USER_NOT_FOUND);
    }

    // Check if like already exists
    if (likeRepository.existsByUserIdAndPostId(userId, postId)) {
      // Unlike: delete the like
      likeRepository.deleteByUserIdAndPostId(userId, postId);
      postClient.likePost(postId, -1);
    } else {
      // Like: create new like
      Like like = Like.builder().userId(userId).postId(postId).build();
      likeRepository.save(like);
      postClient.likePost(postId, 1);
    }
  }

  @PreAuthorize("isAuthenticated()")
  public Map<String, Boolean> checkLikedPosts(String[] postIds) {
    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();

    // Check if user exists
    if (!userRepository.existsById(userId)) {
      throw new AppException(ErrorCode.USER_NOT_FOUND);
    }

    // Get all liked post IDs in a single query
    List<String> likedPostIdsList =
        likeRepository.findLikedPostIdsByUserIdAndPostIds(userId,
                                                          List.of(postIds));

    Set<String> likedPostIdsSet = new HashSet<>(likedPostIdsList);
    Map<String, Boolean> result = new HashMap<>();

    for (String postId : postIds) {
      result.put(postId, likedPostIdsSet.contains(postId));
    }

    return result;
  }

  @PreAuthorize("isAuthenticated()")
  public boolean checkLoginByGoogle() {
    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();
    User user = userRepository.findById(userId).orElseThrow(
        () -> new AppException(ErrorCode.USER_NOT_FOUND));
    return user.isLoginByGoogle();
  }

  @PreAuthorize("isAuthenticated()")
  public boolean setPassword(SetPasswordRequest request) {
    String newPassword = request.getNewPassword();
    String confirmPassword = request.getConfirmPassword();
    if (newPassword == null || newPassword.isEmpty() ||
        confirmPassword == null || confirmPassword.isEmpty()) {
      throw new AppException(ErrorCode.CANT_BE_BLANK);
    }
    if (!newPassword.equals(confirmPassword)) {
      throw new AppException(ErrorCode.PASSWORDS_DO_NOT_MATCH);
    }

    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();

    lock.lock();
    try {
      User user = userRepository.findById(userId).orElseThrow(
          () -> new AppException(ErrorCode.USER_NOT_FOUND));
      if (!user.isLoginByGoogle()) {
        throw new AppException(ErrorCode.USER_ALREADY_SET_PASSWORD);
      }
      user.setLoginByGoogle(false);
      user.setPassword(passwordEncoder.encode(request.getNewPassword()));
      userRepository.save(user);
      return true;
    } finally {
      lock.unlock();
    }
  }

  @PreAuthorize("isAuthenticated()")
  public GetMeResponse getMyInfo() {
    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();
    // Clear cache to ensure fresh data from DB (important for premium updates)
    entityManager.clear();
    User user = userRepository.findById(userId).orElseThrow(
        () -> new AppException(ErrorCode.USER_NOT_FOUND));
    return userMapper.toGetMeResponse(user);
  }

  @PreAuthorize("hasRole('ADMIN')")
  public void deleteUserById(String userId) {
    lock.lock();
    try {
      if (!userRepository.existsById(userId)) {
        throw new AppException(ErrorCode.USER_NOT_FOUND);
      }
      User user = userRepository.findById(userId).orElseThrow(
          () -> new AppException(ErrorCode.USER_NOT_FOUND));
      user.getRoles().clear();
      User saveUser = userRepository.save(user);
      userRepository.delete(saveUser);
    } finally {
      lock.unlock();
    }
  }

  public GetUserTokensResponse getUserTokens(String userId) {
    User user = userRepository.findById(userId).orElseThrow(
        () -> new AppException(ErrorCode.USER_NOT_FOUND));
    return GetUserTokensResponse.builder().tokens(user.getTokens()).build();
  }

  public void modifyUserTokens(ModifyUserTokenRequest request) {
    lock.lock();
    try {
      User user =
          userRepository.findById(request.getUserId())
              .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
      user.setTokens(Math.max(0, user.getTokens()) - request.getTokens());
      userRepository.save(user);
    } finally {
      lock.unlock();
    }
  }

  public void pleaseAddGroup(String requestId, String userId, String groupId) {
    lock.lock();
    try {
      User user = userRepository.findById(userId).orElseThrow(
          () -> new AppException(ErrorCode.USER_NOT_FOUND));
      if (!userRepository.existsById(requestId)) {
        throw new AppException(ErrorCode.USER_NOT_FOUND);
      }

      List<String> memberRequests = user.getMemberRequests();
      if (!memberRequests.contains(requestId + " " + groupId)) {
        memberRequests.add(requestId + " " + groupId);
        user.setMemberRequests(memberRequests);
        userRepository.save(user);
      }
    } finally {
      lock.unlock();
    }
  }

  @PreAuthorize("isAuthenticated()")
  public PageResponse<GetRequestMemberResponse> getMemberRequests(int page,
                                                                  int size) {
    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();
    User user = userRepository.findById(userId).orElseThrow(
        () -> new AppException(ErrorCode.USER_NOT_FOUND));

    List<String> allRequests = user.getMemberRequests();
    int start = (page - 1) * size;
    int end = Math.min(start + size, allRequests.size());

    // Handle empty or out of bounds
    List<GetRequestMemberResponse> pagedRequests =
        (start >= allRequests.size())
            ? new java.util.ArrayList<>()
            : allRequests.subList(start, end)
                  .stream()
                  .map((req) -> {
                    String[] parts = req.split(" ");
                    return GetRequestMemberResponse.builder()
                        .userId(parts[0])
                        .groupId(parts[1])
                        .build();
                  })
                  .toList();

    return PageResponse.<GetRequestMemberResponse>builder()
        .currentPage(page)
        .totalPages((allRequests.size() + size - 1) / size)
        .totalItems(allRequests.size())
        .items(pagedRequests)
        .build();
  }

  public void removeMemberRequest(String requestId, String userId,
                                  String groupId) {
    lock.lock();
    try {
      User user = userRepository.findById(userId).orElseThrow(
          () -> new AppException(ErrorCode.USER_NOT_FOUND));
      List<String> memberRequests = user.getMemberRequests();
      memberRequests.remove(requestId + " " + groupId);
      user.setMemberRequests(memberRequests);
      userRepository.save(user);
    } finally {
      lock.unlock();
    }
  }

  public void addGroup(String groupId, String userId) {
    lock.lock();
    try {
      User user = userRepository.findById(userId).orElseThrow(
          () -> new AppException(ErrorCode.USER_NOT_FOUND));
      List<String> groupsJoined = user.getGroupsJoined();
      if (!groupsJoined.contains(groupId)) {
        groupsJoined.add(groupId);
        user.setGroupsJoined(groupsJoined);
        userRepository.save(user);
      }
    } finally {
      lock.unlock();
    }
  }

  public void removeGroup(String groupId, String userId) {
    lock.lock();
    try {
      User user = userRepository.findById(userId).orElseThrow(
          () -> new AppException(ErrorCode.USER_NOT_FOUND));
      List<String> groupsJoined = user.getGroupsJoined();
      if (groupsJoined.contains(groupId)) {
        groupsJoined.remove(groupId);
        user.setGroupsJoined(groupsJoined);
        userRepository.save(user);
      }
    } finally {
      lock.unlock();
    }
  }

  @PreAuthorize("isAuthenticated()")
  public PageResponse<String> getGroupsJoined(int page, int size) {
    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();
    User user = userRepository.findById(userId).orElseThrow(
        () -> new AppException(ErrorCode.USER_NOT_FOUND));

    List<String> allGroups = user.getGroupsJoined();
    int start = (page - 1) * size;
    int end = Math.min(start + size, allGroups.size());

    // Handle empty or out of bounds
    List<String> pagedGroups = (start >= allGroups.size())
                                   ? new java.util.ArrayList<>()
                                   : allGroups.subList(start, end);

    return PageResponse.<String>builder()
        .currentPage(page)
        .totalPages((allGroups.size() + size - 1) / size)
        .totalItems(allGroups.size())
        .items(pagedGroups)
        .build();
  }

  public List<String> getGroupJoinedInternal(String userId) {
    User user = userRepository.findById(userId).orElseThrow(
        () -> new AppException(ErrorCode.USER_NOT_FOUND));
    return user.getGroupsJoined();
  }

  public boolean isPremium(String userId) {
    // Clear cache to ensure fresh premium status (critical for payment updates)
    entityManager.clear();
    User user = userRepository.findById(userId).orElseThrow(
        () -> new AppException(ErrorCode.USER_NOT_FOUND));
    return user.isPremiumOneMonth() || user.isPremiumSixMonths();
  }

  public List<UserSummaryResponse> getUserSummaries(List<String> userIds) {
    // Clear cache to ensure fresh data from DB
    entityManager.clear();
    return userIds.stream()
        .map(userId -> {
          User user = userRepository.findById(userId).orElseThrow(
              () -> new AppException(ErrorCode.USER_NOT_FOUND));
          return userMapper.toUserSummaryResponse(user);
        })
        .toList();
  }
}

package service.identity.controller;

import feign.Body;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.jar.Attributes;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.multipart.MultipartFile;
import service.identity.DTOs.HttpResponse;
import service.identity.DTOs.request.*;
import service.identity.DTOs.response.*;
import service.identity.service.UserService;

@RestController
@RequestMapping("/users")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class UserController {

  UserService userService;
  @NonFinal @Value("${config.api-key.key1}") String apiKey1;

  @NonFinal @Value("${config.api-key.key2}") String apiKey2;

  @PostMapping("/register")
  HttpResponse<RegisterUserResponse> register(
      @RequestBody @Valid RegisterUserRequest request,
      HttpServletRequest httpServletRequest) {

    String clientIp = httpServletRequest.getHeader("X-Forwarded-For");
    if (clientIp == null || clientIp.isEmpty()) {
      clientIp = httpServletRequest.getRemoteAddr();
    }

    return HttpResponse.<RegisterUserResponse>builder()
        .code(1000)
        .result(userService.register(request, clientIp))
        .message("User registered successfully")
        .build();
  }

  @GetMapping("/get/{id}")
  HttpResponse<GetUserResponse> getUserById(@PathVariable("id") String userId) {

    return HttpResponse.<GetUserResponse>builder()
        .code(1000)
        .result(userService.getUserById(userId))
        .message("User fetched successfully")
        .build();
  }

  @GetMapping("/get-all")
  HttpResponse<List<GetUserResponse>> getAllUsers() {
    return HttpResponse.<List<GetUserResponse>>builder()
        .code(1000)
        .result(userService.getAllUsers())
        .message("All users fetched successfully")
        .build();
  }

  @PostMapping("/change-password")
  HttpResponse<Boolean>
  changePassword(@RequestBody @Valid ChangePasswordRequest request) {
    if (userService.changePassword(request)) {
      return HttpResponse.<Boolean>builder()
          .code(1000)
          .message("Password changed successfully")
          .result(true)
          .build();
    } else {
      return HttpResponse.<Boolean>builder()
          .code(1000)
          .message("Failed to change password")
          .result(false)
          .build();
    }
  }

  @PostMapping("/upload-avatar")
  HttpResponse<UploadAvatarResponse>
  uploadAvatar(@RequestPart("file") MultipartFile file) {
    return HttpResponse.<UploadAvatarResponse>builder()
        .code(1000)
        .result(userService.uploadAvatar(file))
        .message("Avatar uploaded successfully")
        .build();
  }

  @PostMapping("/click-like/{postId}")
  HttpResponse<Boolean> likePost(@PathVariable("postId") String postId) {
    userService.likePost(postId);
    return HttpResponse.<Boolean>builder()
        .code(1000)
        .message("Post liked/unliked successfully")
        .result(true)
        .build();
  }

  @PostMapping("/check-liked-posts")
  HttpResponse<Map<String, Boolean>>
  checkLikedPosts(@RequestBody String[] postIds) {
    Map<String, Boolean> likedStatus = userService.checkLikedPosts(postIds);
    return HttpResponse.<Map<String, Boolean>>builder()
        .code(1000)
        .message("Checked liked posts successfully")
        .result(likedStatus)
        .build();
  }

  @GetMapping("/check-login-by-google")
  HttpResponse<Boolean> checkLoginByGoogle() {
    return HttpResponse.<Boolean>builder()
        .code(1000)
        .message("Check login by google successfully")
        .result(userService.checkLoginByGoogle())
        .build();
  }
  @PostMapping("/set-password")
  HttpResponse<Boolean>
  setPassword(@RequestBody @Valid SetPasswordRequest request) {
    boolean result = userService.setPassword(request);
    return HttpResponse.<Boolean>builder()
        .code(1000)
        .message(result ? "Password set successfully"
                        : "Failed to set password")
        .result(result)
        .build();
  }

  @GetMapping("/me")
  HttpResponse<GetMeResponse> getMyInfo() {
    return HttpResponse.<GetMeResponse>builder()
        .code(1000)
        .result(userService.getMyInfo())
        .message("User info fetched successfully")
        .build();
  }

  @DeleteMapping("/delete/{userId}")
  HttpResponse<Boolean> deleteUser(@PathVariable("userId") String userId) {
    userService.deleteUserById(userId);
    return HttpResponse.<Boolean>builder()
        .code(1000)
        .message("User deleted successfully")
        .result(true)
        .build();
  }

  @GetMapping("/tokens/{userId}")
  ResponseEntity<HttpResponse<GetUserTokensResponse>>
  getUserToken(@PathVariable("userId") String userId,
               @RequestHeader("api-key-1") String apiKey1,
               @RequestHeader("api-key-2") String apiKey2) {
    if (!this.apiKey1.equals(apiKey1) || !this.apiKey2.equals(apiKey2)) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(HttpResponse.<GetUserTokensResponse>builder()
                    .code(1001)
                    .message("Unauthorized: Invalid API keys")
                    .build());
    }
    return ResponseEntity.status(200).body(
        HttpResponse.<GetUserTokensResponse>builder()
            .code(1000)
            .message("User tokens fetched successfully")
            .result(userService.getUserTokens(userId))
            .build());
  }

  @PatchMapping("/modify-tokens")
  ResponseEntity<HttpResponse<?>>
  modifyUserTokens(@RequestBody ModifyUserTokenRequest request,
                   @RequestHeader("api-key-1") String apiKey1,
                   @RequestHeader("api-key-2") String apiKey2) {
    if (!this.apiKey1.equals(apiKey1) || !this.apiKey2.equals(apiKey2)) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(HttpResponse.builder()
                    .code(1001)
                    .message("Unauthorized: Invalid API keys")
                    .build());
    }
    userService.modifyUserTokens(request);
    return ResponseEntity.ok(HttpResponse.builder()
                                 .code(200)
                                 .message("User tokens modified successfully")
                                 .build());
  }

  // new api

  @PostMapping("/request-join-group")
  HttpResponse<Boolean>
  requestJoinGroup(@RequestParam("userId") String userId,
                   @RequestParam("requestId") String requestId,
                   @RequestParam("groupId") String groupId) {
    userService.pleaseAddGroup(requestId, userId, groupId);
    return HttpResponse.<Boolean>builder()
        .code(1000)
        .message("Join group request sent successfully")
        .result(true)
        .build();
  }

  @PatchMapping("/get-request-join-group")
  HttpResponse<PageResponse<GetRequestMemberResponse>> getRequestJoinGroup(
      @RequestParam(value = "size", defaultValue = "10") int size,
      @RequestParam(value = "page", defaultValue = "1") int page) {
    return HttpResponse.<PageResponse<GetRequestMemberResponse>>builder()
        .code(1000)
        .message("Get join group requests successfully")
        .result(userService.getMemberRequests(page, size))
        .build();
  }

  @DeleteMapping("/delete-request-join-group")
  HttpResponse<Boolean>
  deleteRequestJoinGroup(@RequestParam("userId") String userId,
                         @RequestParam("requestId") String requestId,
                         @RequestParam("groupId") String groupId) {
    userService.removeMemberRequest(requestId, userId, groupId);
    return HttpResponse.<Boolean>builder()
        .code(1000)
        .message("Delete join group request successfully")
        .result(true)
        .build();
  }

  @PostMapping("/add-group")
  HttpResponse<Void> addGroup(@RequestParam("userId") String userId,
                              @RequestParam("groupId") String groupId) {
    userService.addGroup(groupId, userId);
    return HttpResponse.<Void>builder()
        .code(1000)
        .message("Group added to user successfully")
        .build();
  }

  @PostMapping("/remove-group")
  HttpResponse<Void> removeGroup(@RequestParam("userId") String userId,
                                 @RequestParam("groupId") String groupId) {
    userService.removeGroup(groupId, userId);
    return HttpResponse.<Void>builder()
        .code(1000)
        .message("Group removed from user successfully")
        .build();
  }

  @GetMapping("/get-group-joined")
  HttpResponse<PageResponse<String>>
  getGroupsJoined(@RequestParam(value = "size", defaultValue = "10") int size,
                  @RequestParam(value = "page", defaultValue = "1") int page) {
    return HttpResponse.<PageResponse<String>>builder()
        .code(1000)
        .message("Get joined groups successfully")
        .result(userService.getGroupsJoined(page, size))
        .build();
  }

  @GetMapping("/get-group-joined-internal")
  HttpResponse<List<String>>
  getGroupJoinedInternal(@RequestParam("userId") String userId) {
    return HttpResponse.<List<String>>builder()
        .code(1000)
        .message("Get joined groups successfully")
        .result(userService.getGroupJoinedInternal(userId))
        .build();
  }

  @GetMapping("/check-premium")
  HttpResponse<Boolean> checkPremium(@RequestParam("userId") String userId) {
    return HttpResponse.<Boolean>builder()
        .code(1000)
        .message("Check premium status successfully")
        .result(userService.isPremium(userId))
        .build();
  }

  @PostMapping("/summaries")
  HttpResponse<List<UserSummaryResponse>>
  getUserStatistics(@RequestBody() GetUserSummaryRequest request) {
    return HttpResponse.<List<UserSummaryResponse>>builder()
        .code(1000)
        .message("User statistics fetched successfully")
        .result(userService.getUserSummaries(request.getUserIds()))
        .build();
  }
}

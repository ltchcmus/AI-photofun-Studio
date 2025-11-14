package service.identity.controller;


import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
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
import service.identity.DTOs.request.ChangePasswordRequest;
import service.identity.DTOs.request.ModifyUserTokenRequest;
import service.identity.DTOs.request.RegisterUserRequest;
import service.identity.DTOs.request.SetPasswordRequest;
import service.identity.DTOs.response.GetUserResponse;
import service.identity.DTOs.response.GetUserTokensResponse;
import service.identity.DTOs.response.RegisterUserResponse;
import service.identity.DTOs.response.UploadAvatarResponse;
import service.identity.entity.LimitRegister;
import service.identity.exception.AppException;
import service.identity.exception.ErrorCode;
import service.identity.repository.LimitRegisterRepository;
import service.identity.service.UserService;

import java.util.List;
import java.util.jar.Attributes;

@RestController
@RequestMapping("/users")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class UserController {

    UserService userService;
    @NonFinal
    @Value("${config.api-key.key1}")
    String apiKey1;

    @NonFinal
    @Value("${config.api-key.key2}")
    String apiKey2;

    @PostMapping("/register")
    HttpResponse<RegisterUserResponse> register(@RequestBody @Valid RegisterUserRequest request,
                                                HttpServletRequest httpServletRequest) {

        String clientIp = httpServletRequest.getHeader("X-Forwarded-For");
        if(clientIp == null || clientIp.isEmpty()){
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
    HttpResponse<Boolean> changePassword(@RequestBody @Valid ChangePasswordRequest request) {
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
    HttpResponse<UploadAvatarResponse> uploadAvatar(@RequestPart("file") MultipartFile file) {
        return HttpResponse.<UploadAvatarResponse>builder()
                .code(1000)
                .result(userService.uploadAvatar(file))
                .message("Avatar uploaded successfully")
                .build();
    }


    @PatchMapping("/click-like/{postId}")
    HttpResponse<Boolean> likePost(@PathVariable("postId") String postId) {
        userService.likePost(postId);
        return HttpResponse.<Boolean>builder()
                .code(1000)
                .message("Post liked/unliked successfully")
                .result(true)
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
    HttpResponse<Boolean> setPassword(@RequestBody @Valid SetPasswordRequest request) {
        boolean result = userService.setPassword(request);
        return HttpResponse.<Boolean>builder()
                .code(1000)
                .message(result ? "Password set successfully" : "Failed to set password")
                .result(result)
                .build();

    }

    @GetMapping("/me")
    HttpResponse<GetUserResponse> getMyInfo() {
        return HttpResponse.<GetUserResponse>builder()
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
    ResponseEntity<HttpResponse<GetUserTokensResponse>> getUserToken(@PathVariable("userId") String userId,
                                                                    @RequestHeader("api-key-1") String apiKey1,
                                                                    @RequestHeader("api-key-2") String apiKey2) {
        if(!this.apiKey1.equals(apiKey1) || !this.apiKey2.equals(apiKey2)){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(HttpResponse.<GetUserTokensResponse>builder()
                    .code(1001)
                    .message("Unauthorized: Invalid API keys")
                    .build());
        }
        return ResponseEntity.status(200).body(HttpResponse.<GetUserTokensResponse>builder()
                .code(1000)
                .message("User tokens fetched successfully")
                .result(userService.getUserTokens(userId))
                .build());
    }


    @PatchMapping("/modify-tokens")
    ResponseEntity<HttpResponse<?>> modifyUserTokens(@RequestBody ModifyUserTokenRequest request,
                                     @RequestHeader("api-key-1") String apiKey1,
                                     @RequestHeader("api-key-2") String apiKey2){
        if(!this.apiKey1.equals(apiKey1) || !this.apiKey2.equals(apiKey2)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(HttpResponse.builder()
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

}

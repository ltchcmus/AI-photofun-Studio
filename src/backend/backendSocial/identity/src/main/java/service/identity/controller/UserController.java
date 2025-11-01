package service.identity.controller;


import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Value;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import service.identity.DTOs.HttpResponse;
import service.identity.DTOs.request.ChangePasswordRequest;
import service.identity.DTOs.request.RegisterUserRequest;
import service.identity.DTOs.response.GetUserResponse;
import service.identity.DTOs.response.RegisterUserResponse;
import service.identity.DTOs.response.UploadAvatarResponse;
import service.identity.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/users")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class UserController {

    UserService userService;

    @PostMapping("/register")
    HttpResponse<RegisterUserResponse> register(@RequestBody @Valid RegisterUserRequest request) {
        return HttpResponse.<RegisterUserResponse>builder()
                .code(1000)
                .result(userService.register(request))
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
        if(userService.changePassword(request)){
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
    HttpResponse<UploadAvatarResponse> uploadAvatar(@RequestPart("file")MultipartFile file) {
        return HttpResponse.<UploadAvatarResponse>builder()
                .code(1000)
                .result(userService.uploadAvatar(file))
                .message("Avatar uploaded successfully")
                .build();
    }
}

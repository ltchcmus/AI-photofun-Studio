package service.identity.controller;


import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Value;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;
import service.identity.DTOs.HttpResponse;
import service.identity.DTOs.request.RegisterUserRequest;
import service.identity.DTOs.response.GetUserResponse;
import service.identity.DTOs.response.RegisterUserResponse;
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
            .result(userService.register(request))
            .message("User registered successfully")
            .build();
    }

    @GetMapping("/get/{id}")
    HttpResponse<GetUserResponse> getUserById(@PathVariable("id") String userId) {
        return HttpResponse.<GetUserResponse>builder()
            .result(userService.getUserById(userId))
            .message("User fetched successfully")
            .build();
    }

    @GetMapping("/get-all")
    HttpResponse<List<GetUserResponse>> getAllUsers() {
        return HttpResponse.<List<GetUserResponse>>builder()
            .result(userService.getAllUsers())
            .message("All users fetched successfully")
            .build();
    }
}

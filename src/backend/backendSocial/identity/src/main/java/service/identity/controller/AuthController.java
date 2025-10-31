package service.identity.controller;


import com.nimbusds.jose.JOSEException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import service.identity.DTOs.HttpResponse;
import service.identity.DTOs.request.LoginRequest;
import service.identity.DTOs.response.LoginResponse;
import service.identity.service.AuthService;

@RestController
@RequestMapping("/auth")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class AuthController {
    AuthService authService;


    public HttpResponse<LoginResponse> login(@RequestBody LoginRequest loginRequest) throws JOSEException {
        return HttpResponse.<LoginResponse>builder()
                .code(1000)
                .message("Login successful")
                .result(authService.login(loginRequest))
                .build();
    }

}

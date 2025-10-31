package service.identity.controller;


import com.nimbusds.jose.JOSEException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;
import service.identity.DTOs.HttpResponse;
import service.identity.DTOs.request.LoginRequest;
import service.identity.DTOs.response.IntrospectIgnoreRefreshResponse;
import service.identity.DTOs.response.IntrospectRefreshResponse;
import service.identity.DTOs.response.LoginResponse;
import service.identity.service.AuthService;
import service.identity.utils.CookieUtils;

import java.text.ParseException;

@RestController
@RequestMapping("/auth")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class AuthController {
    AuthService authService;
    CookieUtils cookieUtils;

    @PostMapping("/login")
    public HttpResponse<LoginResponse> login(@RequestBody LoginRequest loginRequest, HttpServletResponse httpServletResponse) throws JOSEException {

        LoginResponse loginResponse = authService.login(loginRequest);
        String token = loginResponse.getAccessToken();
        Cookie cookie = cookieUtils.createJwtCookie(token);
        httpServletResponse.addCookie(cookie);
        return HttpResponse.<LoginResponse>builder()
                .code(1000)
                .message("Login successful")
                .result(loginResponse)
                .build();
    }

    @GetMapping("/introspect/ignore/{id}")
    public HttpResponse<IntrospectIgnoreRefreshResponse> introspectIgnoreRefresh(@PathVariable("id") String token) throws ParseException, JOSEException {
        return HttpResponse.<IntrospectIgnoreRefreshResponse>builder()
                .code(1000)
                .message("Introspect successful")
                .result(IntrospectIgnoreRefreshResponse.builder()
                        .active(authService.introspect(token, false))
                        .build())
                .build();
    }

    @GetMapping("/introspect/{id}")
    public HttpResponse<IntrospectRefreshResponse> introspectRefresh(@PathVariable("id") String token) throws ParseException, JOSEException {
        return HttpResponse.<IntrospectRefreshResponse>builder()
                .code(1000)
                .message("Introspect successful")
                .result(IntrospectRefreshResponse.builder()
                        .active(authService.introspect(token, true))
                        .build())
                .build();
    }


    @GetMapping("/logout")
    HttpResponse<?> logout(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) throws JOSEException, ParseException {
        String token = httpServletRequest.getHeader("Authorization").split(" ")[1];
        authService.logout(token);
        Cookie cookie = cookieUtils.createExpiredJwtCookie();
        httpServletResponse.addCookie(cookie);
        return HttpResponse.builder()
                .code(1000)
                .message("Logout successful")
                .build();
    }


    @GetMapping("/refresh/{token}")
    HttpResponse<String> refreshToken(@PathVariable("token") String token,HttpServletResponse httpServletResponse) throws ParseException, JOSEException {
        String accessToken = authService.refreshToken(token);
        Cookie cookie;
        if(accessToken == null){
            cookie = cookieUtils.createExpiredJwtCookie();
        }
        else cookie = cookieUtils.createJwtCookie(accessToken);

        httpServletResponse.addCookie(cookie);
        return HttpResponse.<String>builder()
                .code(1000)
                .message(null)
                .result(accessToken)
                .build();
    }
}

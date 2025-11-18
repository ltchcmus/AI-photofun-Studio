package service.identity.controller;


import com.nimbusds.jose.JOSEException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import service.identity.DTOs.HttpResponse;
import service.identity.DTOs.request.LoginRequest;
import service.identity.DTOs.request.gg.ParamGgRequest;
import service.identity.DTOs.response.IntrospectIgnoreRefreshResponse;
import service.identity.DTOs.response.IntrospectRefreshResponse;
import service.identity.DTOs.response.LoginResponse;
import service.identity.DTOs.response.gg.GetInfoResponse;
import service.identity.DTOs.response.gg.GetTokenResponse;
import service.identity.repository.http.GgClient;
import service.identity.repository.http.OpenIdClient;
import service.identity.service.AuthService;
import service.identity.utils.CookieUtils;

import java.net.URI;
import java.text.ParseException;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    AuthService authService;
    CookieUtils cookieUtils;

    @NonFinal
    @Value("${config.http.redirect-after-login-google-frontend-success}")
    String redirectAfterLoginGoogleFrontendSuccess;

    @NonFinal
    @Value("${config.http.redirect-after-login-google-frontend-failure}")
    String redirectAfterLoginGoogleFrontendFailure;

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


    @GetMapping("/authentication")
    ResponseEntity<Void> authenticate(@RequestParam("code") String code, HttpServletResponse response, HttpServletRequest request) {
        String clientIp = request.getHeader("X-Forwarded-For");
        if(clientIp == null || clientIp.isEmpty()) {
            clientIp = request.getRemoteAddr();
        }
        boolean success = authService.authenticate(code, response, clientIp);
        URI redirectUri;
        if(success){
            redirectUri = URI.create(redirectAfterLoginGoogleFrontendSuccess);
        }
        else{
            redirectUri = URI.create(redirectAfterLoginGoogleFrontendFailure);
        }
        return ResponseEntity.status(302).location(redirectUri).build();
    }
}

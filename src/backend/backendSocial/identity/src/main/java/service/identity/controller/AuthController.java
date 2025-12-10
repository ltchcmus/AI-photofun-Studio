package service.identity.controller;


import com.nimbusds.jose.JOSEException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jdk.jshell.execution.Util;
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
import service.identity.DTOs.response.RefreshTokenResponse;
import service.identity.DTOs.response.gg.GetInfoResponse;
import service.identity.DTOs.response.gg.GetTokenResponse;
import service.identity.entity.RemoveToken;
import service.identity.entity.User;
import service.identity.repository.http.GgClient;
import service.identity.repository.http.OpenIdClient;
import service.identity.service.AuthService;
import service.identity.utils.CookieUtils;
import service.identity.utils.Utils;

import java.net.URI;
import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    AuthService authService;
    CookieUtils cookieUtils;
    Utils utils;
    @NonFinal
    @Value("${config.http.redirect-after-login-google-frontend-success}")
    String redirectAfterLoginGoogleFrontendSuccess;

    @NonFinal
    @Value("${config.http.redirect-after-login-google-frontend-failure}")
    String redirectAfterLoginGoogleFrontendFailure;


    @NonFinal
    @Value("${config.jwt.expires-in}")
    Long jwtExpiresIn;

    @NonFinal
    @Value("${config.jwt.refresh-expires-in}")
    Long jwtRefreshExpiresIn;



    @PostMapping("/login")
    public HttpResponse<LoginResponse> login(@RequestBody LoginRequest loginRequest, HttpServletResponse httpServletResponse) throws JOSEException {

        service.identity.entity.User user = authService.login(loginRequest);
        String accessToken = utils.generateToken(user);
        String refreshToken = utils.generateRefreshToken(user);
        Cookie cookie = cookieUtils.createJwtCookie(refreshToken);

        httpServletResponse.addCookie(cookie);
        return HttpResponse.<LoginResponse>builder()
                .code(1000)
                .message("Login successful")
                .result(LoginResponse.builder()
                        .accessToken(accessToken)
                        .expiresAt(Instant.now().plus(jwtExpiresIn, ChronoUnit.SECONDS))
                        .build())
                .build();
    }

    @GetMapping("/introspect/access/{id}")
    public HttpResponse<IntrospectIgnoreRefreshResponse> introspectAccessToken(@PathVariable("id") String token) throws ParseException, JOSEException {
        return HttpResponse.<IntrospectIgnoreRefreshResponse>builder()
                .code(1000)
                .message("Introspect successful")
                .result(IntrospectIgnoreRefreshResponse.builder()
                        .active(authService.introspect(token, false))
                        .build())
                .build();
    }

    @GetMapping("/introspect/refresh/{id}")
    public HttpResponse<IntrospectRefreshResponse> introspectRefreshToken(@PathVariable("id") String token) throws ParseException, JOSEException {
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
        String accessToken = httpServletRequest.getHeader("Authorization").split(" ")[1];
        String refreshToken = httpServletRequest.getCookies() == null ? null :
                java.util.Arrays.stream(httpServletRequest.getCookies())
                        .filter(cookie -> cookie.getName().equals("jwt"))
                        .findFirst()
                        .map(Cookie::getValue)
                        .orElse(null);

        authService.logout(accessToken, refreshToken);
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

    @GetMapping("/refresh-token")
    HttpResponse<RefreshTokenResponse> refreshTokenFromCookie(@CookieValue(name = "jwt", defaultValue = "") String refreshToken, HttpServletResponse httpServletResponse) throws ParseException, JOSEException {
        service.identity.entity.User user = authService.refresh(refreshToken);
        String accessToken = utils.generateToken(user);
        String refreshNewToken = utils.generateRefreshToken(user);
        Cookie cookie = cookieUtils.createJwtCookie(refreshNewToken);
        httpServletResponse.addCookie(cookie);
        return HttpResponse.<RefreshTokenResponse>builder()
                .code(1000)
                .message("Refresh token successful")
                .result(RefreshTokenResponse.builder()
                        .accessToken(accessToken)
                        .build())
                .build();
    }
}

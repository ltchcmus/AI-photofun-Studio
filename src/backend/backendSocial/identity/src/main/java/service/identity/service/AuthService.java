package service.identity.service;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.SignedJWT;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import service.identity.DTOs.request.LoginRequest;
import service.identity.DTOs.request.RegisterUserRequest;
import service.identity.DTOs.response.IntrospectIgnoreRefreshResponse;
import service.identity.DTOs.response.LoginResponse;
import service.identity.DTOs.response.RegisterUserResponse;
import service.identity.DTOs.response.gg.GetInfoResponse;
import service.identity.DTOs.response.gg.GetTokenResponse;
import service.identity.entity.RemoveToken;
import service.identity.entity.User;
import service.identity.exception.AppException;
import service.identity.exception.ErrorCode;
import service.identity.repository.RemoveTokenRepository;
import service.identity.repository.UserRepository;
import service.identity.repository.http.GgClient;
import service.identity.repository.http.OpenIdClient;
import service.identity.utils.CookieUtils;
import service.identity.utils.Utils;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthService {
  UserRepository userRepository;
  RemoveTokenRepository removeTokenRepository;
  PasswordEncoder passwordEncoder;
  GgClient ggClient;
  OpenIdClient openIdClient;
  Utils utils;
  CookieUtils cookieUtils;
  UserService userService;

  @NonFinal @Value("${config.jwt.expires-in}") Long jwtExpiresIn;

  @NonFinal @Value("${config.jwt.refresh-expires-in}") Long jwtRefreshExpiresIn;

  @NonFinal @Value("${config.jwt.secret}") String jwtSecret;

  @NonFinal @Value("${config.jwt.secret-refresh}") String jwtRefreshSecret;

  public User login(LoginRequest loginRequest) throws JOSEException {

    String usernameOrEmail = loginRequest.getUsernameOrEmail();
    String password = loginRequest.getPassword();

    User user =
        userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail);

    if (user == null) {
      throw new AppException(ErrorCode.INCORRECT_ACCOUNT);
    }

    if (!passwordEncoder.matches(password, user.getPassword())) {
      throw new AppException(ErrorCode.INCORRECT_ACCOUNT);
    }
    return user;
  }

  public boolean introspect(String token, boolean isRefresh)
      throws ParseException, JOSEException {
    int n = token.length();
    if (n == 0) {
      return false;
    }

    if (removeTokenRepository.existsByToken(token)) {
      return false;
    }

    SignedJWT signedJWT = SignedJWT.parse(token);
    Instant expirationTime =
        signedJWT.getJWTClaimsSet().getExpirationTime().toInstant();
    boolean isValidAboutTime = Instant.now().isBefore(expirationTime);

    String secret = isRefresh ? jwtRefreshSecret : jwtSecret;

    JWSVerifier verifier = new MACVerifier(secret.getBytes());
    boolean isValidSignature = signedJWT.verify(verifier);

    return isValidAboutTime && isValidSignature;
  }

  @PreAuthorize("isAuthenticated()")
  public void logout(String accessToken, String refreshToken)
      throws ParseException {
    SignedJWT signedJWTAccess = SignedJWT.parse(accessToken);
    Instant accessExpireTime =
        signedJWTAccess.getJWTClaimsSet().getExpirationTime().toInstant();
    removeTokenRepository.save(RemoveToken.builder()
                                   .removeAt(accessExpireTime)
                                   .token(accessToken)
                                   .build());
    SignedJWT signedJWTRefresh = SignedJWT.parse(refreshToken);
    Instant refreshExpireTime =
        signedJWTRefresh.getJWTClaimsSet().getExpirationTime().toInstant();
    removeTokenRepository.save(RemoveToken.builder()
                                   .removeAt(refreshExpireTime)
                                   .token(refreshToken)
                                   .build());
  }

  public String refreshToken(String token)
      throws ParseException, JOSEException {
    SignedJWT signedJWT = SignedJWT.parse(token);
    User user =
        userRepository.findById(signedJWT.getJWTClaimsSet().getSubject())
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    return utils.generateToken(user);
  }

  public boolean authenticate(String code, HttpServletResponse response,
                              String clientIp) {
    if (code == null || code.isEmpty()) {
      return false;
    }
    log.info("code {}", code);

    try {
      // Use RestTemplate instead of Feign for reliable form-urlencoded POST
      org.springframework.web.client.RestTemplate restTemplate =
          new org.springframework.web.client.RestTemplate();

      org.springframework.http.HttpHeaders headers =
          new org.springframework.http.HttpHeaders();
      headers.setContentType(
          org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED);

      org.springframework.util.MultiValueMap<String, String> params =
          utils.generateParamGgRequest(code);
      log.info("Sending token request with params: code={}, client_id={}, " +
               "redirect_uri={}",
               code.substring(0, Math.min(code.length(), 20)) + "...",
               params.getFirst("client_id"), params.getFirst("redirect_uri"));

      org.springframework.http.HttpEntity<
          org.springframework.util.MultiValueMap<String, String>> request =
          new org.springframework.http.HttpEntity<>(params, headers);

      org.springframework.http.ResponseEntity<GetTokenResponse> responseEntity =
          restTemplate.postForEntity("https://oauth2.googleapis.com/token",
                                     request, GetTokenResponse.class);

      GetTokenResponse ggTokenResponse = responseEntity.getBody();
      String token =
          ggTokenResponse != null ? ggTokenResponse.getAccessToken() : null;
      log.info("token {}", token);

      if (token == null || token.isEmpty()) {
        return false;
      }

      GetInfoResponse ggInfoResponse =
          openIdClient.getUserInfoByAccessToken("Bearer " + token);
      log.info("Google user info: {}", ggInfoResponse.toString());

      String username = ggInfoResponse.getEmail();
      log.info("Checking if user exists with email: {}", username);

      try {
        User user = userRepository.findByUsernameOrEmail(username, username);
        log.info("User found: {}", user != null ? user.getUserId() : "null");

        if (user != null) {
          log.info("User already exists, generating tokens...");
          String accessToken = utils.generateToken(user);
          String refreshToken = utils.generateRefreshToken(user);
          log.info("JWT tokens generated");
          Cookie cookie = cookieUtils.createJwtCookie(refreshToken);
          response.addCookie(cookie);
          response.setHeader("X-Access-Token", accessToken);
          log.info("Cookie and header added to response");
          return true;
        }
      } catch (Exception e) {
        log.error("Error during existing user login: {}", e.getMessage(), e);
        throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
      }

      log.info("User not found, creating new user...");
      RegisterUserRequest registerUserRequest =
          RegisterUserRequest.builder()
              .username(username)
              .email(ggInfoResponse.getEmail())
              .fullName(ggInfoResponse.getName())
              .password(ggInfoResponse.getSub())
              .roles(new HashSet<>(List.of("USER")))
              .loginByGoogle(true)
              .confirmPass(ggInfoResponse.getSub())
              .build();
      log.info("Register request created: {}", registerUserRequest.toString());

      try {
        log.info("Calling userService.register...");

        RegisterUserResponse userResponse =
            userService.register(registerUserRequest, clientIp);
        log.info("Registered user response: {}", userResponse.toString());

        User saveUser =
            userRepository.findById(userResponse.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        log.info("Retrieved saved user: {}", saveUser.getUserId());

        String accessToken = utils.generateToken(saveUser);
        String refreshToken = utils.generateRefreshToken(saveUser);
        Cookie cookie = cookieUtils.createJwtCookie(refreshToken);
        response.addCookie(cookie);
        response.setHeader("X-Access-Token", accessToken);
        log.info("Cookie and header added for new user");
        return true;
      } catch (AppException e) {
        log.error("AppException during user registration: {} - {}",
                  e.getErrorCode().getCode(), e.getMessage());
        throw e;
      } catch (Exception e) {
        log.error("Error during user registration: {}", e.getMessage(), e);
        throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
      }
    } catch (AppException e) {
      // Re-throw AppException to preserve specific error codes (like
      // LIMIT_REGISTER_EXCEEDED)
      log.error("AppException during authentication: {} - {}",
                e.getErrorCode().getCode(), e.getMessage());
      throw e;
    } catch (org.springframework.web.client.HttpClientErrorException e) {
      // Log detailed error from Google API
      log.error("Google API error - Status: {}, Response: {}",
                e.getStatusCode(), e.getResponseBodyAsString());
      throw new AppException(ErrorCode.AUTHENTICATION_FAILED);
    } catch (Exception e) {
      log.error("Error during authentication: {} - {}", e.getClass().getName(),
                e.getMessage(), e);
      throw new AppException(ErrorCode.AUTHENTICATION_FAILED);
    }
  }

  public User refresh(String token) throws ParseException, JOSEException {
    if (token == null || token.isEmpty()) {
      throw new AppException(ErrorCode.INVALID_TOKEN);
    }
    if (!introspect(token, true)) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }
    SignedJWT signedJWT = SignedJWT.parse(token);
    String tokenUserId = signedJWT.getJWTClaimsSet().getSubject();

    removeTokenRepository.save(
        RemoveToken.builder()
            .token(token)
            .removeAt(
                signedJWT.getJWTClaimsSet().getExpirationTime().toInstant())
            .build());
    User user =
        userRepository.findById(tokenUserId)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    return user;
  }

  public void addRemoveToken(RemoveToken removeToken) {
    removeTokenRepository.save(removeToken);
  }
}

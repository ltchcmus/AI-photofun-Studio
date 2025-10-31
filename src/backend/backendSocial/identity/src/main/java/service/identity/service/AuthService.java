package service.identity.service;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import service.identity.DTOs.request.LoginRequest;
import service.identity.DTOs.response.IntrospectIgnoreRefreshResponse;
import service.identity.DTOs.response.LoginResponse;
import service.identity.entity.RemoveToken;
import service.identity.entity.User;
import service.identity.exception.AppException;
import service.identity.exception.ErrorCode;
import service.identity.repository.RemoveTokenRepository;
import service.identity.repository.UserRepository;
import service.identity.utils.Utils;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthService {
    UserRepository userRepository;
    RemoveTokenRepository removeTokenRepository;
    PasswordEncoder passwordEncoder;
    Utils utils;


    @NonFinal
    @Value("${config.jwt.expires-in}")
    Long jwtExpiresIn;

    @NonFinal
    @Value("${config.jwt.refresh-expires-in}")
    Long jwtRefreshExpiresIn;


    @NonFinal
    @Value("${config.jwt.secret}")
    String jwtSecret;

    public LoginResponse login(LoginRequest loginRequest) throws JOSEException {

        String usernameOrEmail = loginRequest.getUsernameOrEmail();
        String password = loginRequest.getPassword();

        User user = userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail);

        if (user == null) {
            throw new AppException(ErrorCode.INCORRECT_ACCOUNT);
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new AppException(ErrorCode.INCORRECT_ACCOUNT);
        }

        String accessToken = utils.generateToken(user);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .expiresAt(Instant.now().plus(jwtExpiresIn, ChronoUnit.SECONDS))
                .build();
    }

    public boolean introspect(String token, boolean isRefresh) throws ParseException, JOSEException {
        int n = token.length();
        if(n == 0){
            return false;
        }

        if(removeTokenRepository.existsByToken(token)) {
            return false;
        }

        SignedJWT signedJWT = SignedJWT.parse(token);
        Instant expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime().toInstant();
        Instant refreshTime = signedJWT.getJWTClaimsSet().getIssueTime().toInstant().plus(jwtRefreshExpiresIn, ChronoUnit.SECONDS);

        boolean isValidAboutTime = isRefresh ? Instant.now().isBefore(refreshTime) : Instant.now().isBefore(expirationTime);

        JWSVerifier verifier = new MACVerifier(jwtSecret.getBytes());
        boolean isValidSignature = signedJWT.verify(verifier);

        return isValidAboutTime && isValidSignature;

    }

    @PreAuthorize("isAuthenticated()")
    public void logout(String token) throws ParseException {
        SignedJWT signedJWT = SignedJWT.parse(token);
        Instant refreshTime = signedJWT.getJWTClaimsSet().getIssueTime().toInstant().plus(jwtRefreshExpiresIn, ChronoUnit.SECONDS);
        removeTokenRepository.save(RemoveToken.builder()
                        .removeAt(refreshTime)
                        .token(token)
                .build());
    }

    public String refreshToken(String token) throws ParseException, JOSEException {
        SignedJWT signedJWT = SignedJWT.parse(token);
        User user = userRepository.findById(signedJWT.getJWTClaimsSet().getSubject())
                .orElseThrow(()->{
                    throw new AppException(ErrorCode.USER_NOT_FOUND);
                });
        return utils.generateToken(user);
    }
}

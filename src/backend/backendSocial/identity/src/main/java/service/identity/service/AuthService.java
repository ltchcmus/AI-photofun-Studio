package service.identity.service;

import com.nimbusds.jose.JOSEException;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import service.identity.DTOs.request.LoginRequest;
import service.identity.DTOs.response.LoginResponse;
import service.identity.entity.User;
import service.identity.exception.AppException;
import service.identity.exception.ErrorCode;
import service.identity.repository.UserRepository;
import service.identity.utils.Utils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthService {
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;
    Utils utils;


    @NonFinal
    @Value("${config.jwt.expires-in")
    Long jwtExpiresIn;

    public LoginResponse login(LoginRequest loginRequest) throws JOSEException {

        String usernameOrEmail = loginRequest.getUsernameOrEmail();
        String password = loginRequest.getPassword();

        User user = userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail);

        if (user == null) {
            throw new AppException(ErrorCode.INCORRECT_ACCOUNT);
        }

        if (!passwordEncoder.matches(user.getPassword(), password)) {
            throw new AppException(ErrorCode.INCORRECT_ACCOUNT);
        }

        String accessToken = utils.generateToken(user);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .expiresAt(Instant.now().plus(jwtExpiresIn, ChronoUnit.SECONDS))
                .build();
    }
}

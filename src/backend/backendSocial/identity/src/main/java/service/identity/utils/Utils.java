package service.identity.utils;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import service.identity.DTOs.request.gg.ParamGgRequest;
import service.identity.entity.Authority;
import service.identity.entity.Role;
import service.identity.entity.User;
import service.identity.exception.AppException;
import service.identity.exception.ErrorCode;
import service.identity.repository.RoleRepository;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Set;
import java.util.StringJoiner;
import java.util.UUID;
import org.springframework.core.io.ClassPathResource;

@Component
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Utils {

    @Autowired
    RoleRepository roleRepository;

    @NonFinal
    @Value("${config.jwt.secret}")
    private String jwtSecret;

    @NonFinal
    @Value("${config.jwt.expires-in}")
    private long expiresIn;

    @NonFinal
    @Value("${config.jwt.refresh-expires-in}")
    private long refreshExpiresIn;

    @NonFinal
    @Value("${config.http.redirect-uri}")
    private String redirectUri;

    @NonFinal
    @Value("${config.gg.client-id}")
    private String clientId;

    @NonFinal
    @Value("${config.gg.client-secret}")
    private String clientSecret;

    @NonFinal
    @Value("${config.jwt.secret-refresh}")
    private String jwtRefreshSecret;


    public String generateScope(User user){
        StringJoiner scope = new StringJoiner(" ");
        Set<Role> roles = user.getRoles();
        for (Role role : roles){
            String roleName = "ROLE_" + role.getRoleName();
            scope.add(roleName);
            for(Authority authority : role.getAuthorities()){
                scope.add(authority.getAuthorityName());
            }
        }

        return scope.toString();
    }

    public String generateToken(User user) throws JOSEException {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        JWTClaimsSet claimSet = new JWTClaimsSet.Builder()
                .subject(user.getUserId())
                .issuer("ThanhCong")
                .expirationTime(Date.from(Instant.now().plus(expiresIn, ChronoUnit.SECONDS)))
                .issueTime(Date.from(Instant.now()))
                .jwtID(String.valueOf(UUID.randomUUID()))
                .audience("NMCNPM-CLIENT")
                .claim("scope", generateScope(user))
                .claim("type", "access")
                .build();


        Payload payload = new Payload(claimSet.toJSONObject());
        JWSObject jwtObject = new JWSObject(header, payload);

        jwtObject.sign(new MACSigner(jwtSecret.getBytes()));

        return jwtObject.serialize();
    }

    public String generateRefreshToken(User user) throws JOSEException {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        JWTClaimsSet claimSet = new JWTClaimsSet.Builder()
                .subject(user.getUserId())
                .issuer("ThanhCong")
                .expirationTime(Date.from(Instant.now().plus(refreshExpiresIn, ChronoUnit.SECONDS)))
                .issueTime(Date.from(Instant.now()))
                .jwtID(String.valueOf(UUID.randomUUID()))
                .audience("NMCNPM-CLIENT")
                .claim("type", "refresh")
                .claim("scope", generateScope(user))
                .build();
        Payload payload = new Payload(claimSet.toJSONObject());
        JWSObject jwtObject = new JWSObject(header, payload);
        jwtObject.sign(new MACSigner(jwtRefreshSecret.getBytes()));
        return jwtObject.serialize();
    }

    public ParamGgRequest generateParamGgRequest(String code) {
        return ParamGgRequest.builder()
                .code(code)
                .client_secret(clientSecret)
                .client_id(clientId)
                .grant_type("authorization_code")
                .redirect_uri(redirectUri)
                .build();
    }

    public Role getRoleDefault(){
        return roleRepository.findById("USER").orElseThrow(
                ()-> new AppException(ErrorCode.ROLE_NOT_FOUND)
        );
    }

    public String Welcome(String username) {
        try {
            ClassPathResource resource = new ClassPathResource("templates/welcome.html");
            String content = new String(Files.readAllBytes(Paths.get(resource.getURI())), StandardCharsets.UTF_8);
            return content.replace("{{username}}", username);
        } catch (IOException e) {
            log.error("Error reading welcome.html template: {}", e.getMessage());
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

}

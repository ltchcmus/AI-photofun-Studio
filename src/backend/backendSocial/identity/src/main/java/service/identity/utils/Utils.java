package service.identity.utils;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import service.identity.entity.Authority;
import service.identity.entity.Role;
import service.identity.entity.User;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Set;
import java.util.StringJoiner;
import java.util.UUID;

@Component
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Utils {

    @NonFinal
    @Value("${config.jwt.secret}")
    private String jwtSecret;

    @NonFinal
    @Value("${config.jwt.expires-in}")
    private long expiresIn;

    @NonFinal
    @Value("${config.jwt.refresh-expires-in}")
    private long refreshExpiresIn;


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
                .build();


        Payload payload = new Payload(claimSet.toJSONObject());
        JWSObject jwtObject = new JWSObject(header, payload);

        jwtObject.sign(new MACSigner(jwtSecret.getBytes()));

        return jwtObject.serialize();
    }



}

package service.identity.DTOs.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import java.util.Set;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@Slf4j
@Builder
public class RegisterUserResponse {
    String userId;
    String username;
    String email;
    String fullName;

    Set<RoleResponse> roles;
}

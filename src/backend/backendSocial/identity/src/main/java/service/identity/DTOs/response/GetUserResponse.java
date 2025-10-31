package service.identity.DTOs.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
public class GetUserResponse {
    String userId;
    String username;
    String email;
    String fullName;
    Set<RoleResponse> roles;
}

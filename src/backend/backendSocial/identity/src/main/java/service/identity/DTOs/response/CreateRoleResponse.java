package service.identity.DTOs.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
public class CreateRoleResponse {
    String roleName;
    String description;
    Set<AuthorityResponse> authorities;
}

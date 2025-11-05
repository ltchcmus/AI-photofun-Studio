package service.identity.DTOs.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateRoleRequest {
    @NotBlank(message = "ROLE_NAME_REQUIRED")
    String roleName;
    String description;
    Set<String> authorities;
}

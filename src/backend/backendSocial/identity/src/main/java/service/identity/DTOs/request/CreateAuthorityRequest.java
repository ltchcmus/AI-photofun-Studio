package service.identity.DTOs.request;


import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Builder
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateAuthorityRequest {
    @NotBlank(message = "AUTHORITY_NAME_REQUIRED")
    String authorityName;
    String description;
}

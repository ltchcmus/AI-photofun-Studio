package service.identity.DTOs.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    @NotBlank(message = "USERNAME_OR_EMAIL_REQUIRED")
    String usernameOrEmail;
    @Size(min = 4,max = 30, message = "PASSWORD_INVALID")
    String password;
}

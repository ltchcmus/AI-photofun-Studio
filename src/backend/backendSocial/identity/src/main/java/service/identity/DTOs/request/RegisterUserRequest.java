package service.identity.DTOs.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import service.identity.configuration.CustomValidatorUsername;

import java.util.Set;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RegisterUserRequest{
    @NotBlank(message = "USERNAME_REQUIRED")
    @CustomValidatorUsername(min = 5, max = 20, message = "USERNAME_INVALID")
    String username;
    @NotBlank(message = "PASSWORD_REQUIRED")
    @Size(min = 4, max = 30, message = "PASSWORD_INVALID")
    String password;

    @NotBlank(message = "CONFIRM_PASSWORD_REQUIRED")
    String confirmPass;

    @NotBlank(message = "EMAIL_REQUIRED")
    String email;

    String phone;

    String fullName = "User Default";

    Set<String> roles;
}

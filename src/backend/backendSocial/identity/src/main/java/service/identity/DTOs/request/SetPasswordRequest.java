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
public class SetPasswordRequest {
  @NotBlank(message = "PASSWORD_REQUIRED")
  @Size(min = 4, max = 30, message = "PASSWORD_INVALID")
  String newPassword;

  @NotBlank(message = "CONFIRM_PASSWORD_REQUIRED") String confirmPassword;
}

package service.identity.DTOs.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
public class SetPasswordRequest {
    String newPassword;
    String confirmPassword;
}

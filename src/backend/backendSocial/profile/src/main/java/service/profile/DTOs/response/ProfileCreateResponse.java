package service.profile.DTOs.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProfileCreateResponse {
    String userId;
    String fullName;
    String phone;
    String email;
    boolean verified;
}

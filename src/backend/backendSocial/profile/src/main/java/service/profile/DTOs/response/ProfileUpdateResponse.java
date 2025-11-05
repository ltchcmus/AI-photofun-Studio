package service.profile.DTOs.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProfileUpdateResponse {
    String fullName;
    String phone;
    String email;
    String avatarUrl;
    boolean verified;
}

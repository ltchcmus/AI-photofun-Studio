package service.profile.DTOs.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProfileUpdateRequest {
    String fullName;
    String phone;
    String email;
    String avatarUrl;
    boolean verified;

}
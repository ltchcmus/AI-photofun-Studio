package service.identity.DTOs.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
public class GetMeResponse {
    String userId;
    String username;
    String email;
    boolean premiumOneMonth;
    boolean premiumSixMonths;
    int tokens;
    boolean loginByGoogle;
    int premiumPoints;
    String avatarUrl;
}

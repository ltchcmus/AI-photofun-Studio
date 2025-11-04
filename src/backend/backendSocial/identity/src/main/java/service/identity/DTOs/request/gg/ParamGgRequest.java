package service.identity.DTOs.request.gg;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
public class ParamGgRequest {
    String code;
    String client_id;
    String client_secret;
    String redirect_uri;
    String grant_type;
}

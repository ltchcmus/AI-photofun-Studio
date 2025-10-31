package service.identity.DTOs.response;


import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
public class IntrospectIgnoreRefreshResponse {
    boolean active;
}

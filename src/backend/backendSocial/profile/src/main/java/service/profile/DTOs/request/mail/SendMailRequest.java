package service.profile.DTOs.request.mail;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
public class SendMailRequest {
    String toEmail;
    String toName;
    String subject;
    String content;
}

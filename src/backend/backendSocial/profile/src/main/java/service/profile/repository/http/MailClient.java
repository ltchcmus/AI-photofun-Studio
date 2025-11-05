package service.profile.repository.http;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import service.profile.DTOs.HttpResponse;
import service.profile.DTOs.request.mail.SendMailRequest;
import service.profile.configuration.RequestPartConfig;

@FeignClient(name = "mail-service",
        url = "${config.http.mail}",
        configuration = {RequestPartConfig.class})
public interface MailClient {
    @PostMapping("/api/v1/mail/send")
    HttpResponse<Void> sendMail(@RequestBody SendMailRequest request);
}

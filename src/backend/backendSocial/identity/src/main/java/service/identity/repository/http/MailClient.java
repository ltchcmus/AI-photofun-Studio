package service.identity.repository.http;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import service.identity.DTOs.HttpResponse;
import service.identity.DTOs.request.mail.SendMailRequest;
import service.identity.configuration.RequestPartConfig;

@FeignClient(name = "mail-service",
        url = "${config.http.mail}",
        configuration = {RequestPartConfig.class})
public interface MailClient {
    @PostMapping("/api/v1/mail/send")
    HttpResponse<Void> sendMail(@RequestBody SendMailRequest request);
}

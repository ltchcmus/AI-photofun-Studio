package service.identity.repository.http;


import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import service.identity.DTOs.response.gg.GetInfoResponse;

@FeignClient(name = "open-id-client", url = "https://openidconnect.googleapis.com")
public interface OpenIdClient {
    @GetMapping(value = "/v1/userinfo", consumes = MediaType.APPLICATION_JSON_VALUE)
    GetInfoResponse getUserInfoByAccessToken(@RequestHeader("Authorization") String authorization);
}

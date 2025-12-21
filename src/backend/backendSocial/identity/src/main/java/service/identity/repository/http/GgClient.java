package service.identity.repository.http;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import service.identity.DTOs.response.gg.GetTokenResponse;
import service.identity.configuration.RequestPartConfig;

@FeignClient(name = "gg-client", url = "https://oauth2.googleapis.com", configuration = RequestPartConfig.class)
public interface GgClient {
    @PostMapping(value = "/token", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    GetTokenResponse getToken(@RequestBody MultiValueMap<String, String> params);
}

package service.identity.repository.http;

import feign.QueryMap;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import service.identity.DTOs.request.gg.ParamGgRequest;
import service.identity.DTOs.response.gg.GetTokenResponse;

@FeignClient(name = "gg-client", url = "https://oauth2.googleapis.com")
public interface GgClient {
    @PostMapping(value = "/token", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    GetTokenResponse getToken(@QueryMap ParamGgRequest paramGgRequest);
}

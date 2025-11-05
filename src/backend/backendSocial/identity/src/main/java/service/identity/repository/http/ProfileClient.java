package service.identity.repository.http;


import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import service.identity.DTOs.HttpResponse;
import service.identity.DTOs.request.profile.ProfileCreateRequest;
import service.identity.DTOs.response.profile.ProfileCreateResponse;
import service.identity.configuration.AutoAddHeader;
import service.identity.configuration.RequestPartConfig;

@FeignClient(name = "profile-client", url = "${config.http.profile}", configuration = {AutoAddHeader.class, RequestPartConfig.class})
public interface ProfileClient {
    @PostMapping(value = "/create", consumes = MediaType.APPLICATION_JSON_VALUE)
    HttpResponse<ProfileCreateResponse> create(@RequestBody ProfileCreateRequest request);
}

package service.identity.repository.http;


import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestParam;
import service.identity.DTOs.HttpResponse;
import service.identity.configuration.AutoAddHeader;
import service.identity.configuration.RequestPartConfig;

@FeignClient(name = "post-service", url = "${config.http.post}",
        configuration = {AutoAddHeader.class, RequestPartConfig.class})
public interface PostClient {
    @PatchMapping("/like")
    HttpResponse<Void> likePost(@RequestParam("postId") String postId, @RequestParam("like") int numberLike);
}

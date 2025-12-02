package service.identity.repository.http;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import service.identity.DTOs.HttpResponse;
import service.identity.configuration.AutoAddHeader;

@FeignClient(name = "post-service", url = "${config.http.post}",
             configuration = {AutoAddHeader.class})
public interface PostClient {
  @PostMapping("/like")
  HttpResponse<Void> likePost(@RequestParam("postId") String postId,
                              @RequestParam("like") int numberLike);
}

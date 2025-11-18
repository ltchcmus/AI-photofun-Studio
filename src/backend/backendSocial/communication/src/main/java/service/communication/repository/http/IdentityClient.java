package service.communication.repository.http;

import java.util.List;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestParam;
import service.communication.DTOs.HttpResponse;

@FeignClient(name = "identity-client", url = "${config.http.identity}")
public interface IdentityClient {
  @PatchMapping("/users/request-join-group")
  HttpResponse<Boolean>
  requestJoinGroup(@RequestParam("userId") String userId,
                   @RequestParam("requestId") String requestId,
                   @RequestParam("groupId") String groupId);

  @DeleteMapping("/users/delete-request-join-group")
  HttpResponse<Boolean>
  deleteRequestJoinGroup(@RequestParam("userId") String userId,
                         @RequestParam("requestId") String requestId,
                         @RequestParam("groupId") String groupId);

  @PatchMapping("/users/add-group")
  HttpResponse<Void> addGroup(@RequestParam("userId") String userId,
                              @RequestParam("groupId") String groupId);

  @GetMapping("/users/get-group-joined-internal")
  HttpResponse<List<String>>
  getGroupJoinedInternal(@RequestParam("userId") String userId);

  @GetMapping("/users/check-premium")
  HttpResponse<Boolean> checkPremium(@RequestParam("userId") String userId);
}

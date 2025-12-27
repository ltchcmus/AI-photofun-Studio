package service.communication.repository.http;

import java.util.List;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import service.communication.DTOs.HttpResponse;
import service.communication.DTOs.request.GetUserSummaryRequest;
import service.communication.DTOs.response.UserSummaryResponse;

@FeignClient(name = "identity-client", url = "${config.http.identity}")
public interface IdentityClient {
  @PostMapping("/users/request-join-group")
  HttpResponse<Boolean>
  requestJoinGroup(@RequestParam("userId") String userId,
                   @RequestParam("requestId") String requestId,
                   @RequestParam("groupId") String groupId);

  @DeleteMapping("/users/delete-request-join-group")
  HttpResponse<Boolean>
  deleteRequestJoinGroup(@RequestParam("userId") String userId,
                         @RequestParam("requestId") String requestId,
                         @RequestParam("groupId") String groupId);

  @PostMapping("/users/add-group")
  HttpResponse<Void> addGroup(@RequestParam("userId") String userId,
                              @RequestParam("groupId") String groupId);

  @PostMapping("/users/remove-group")
  HttpResponse<Void> removeGroup(@RequestParam("userId") String userId,
                                 @RequestParam("groupId") String groupId);

  @GetMapping("/users/get-group-joined-internal")
  HttpResponse<List<String>>
  getGroupJoinedInternal(@RequestParam("userId") String userId);

  @GetMapping("/users/check-premium")
  HttpResponse<Boolean> checkPremium(@RequestParam("userId") String userId);

  @PostMapping("/users/summaries")
  HttpResponse<List<UserSummaryResponse>>
  getUserStatistics(@RequestBody() GetUserSummaryRequest request);
}

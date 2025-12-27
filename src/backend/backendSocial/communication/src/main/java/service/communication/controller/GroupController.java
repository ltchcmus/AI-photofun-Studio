package service.communication.controller;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import service.communication.DTOs.HttpResponse;
import service.communication.DTOs.request.UpdateGroupRequest;
import service.communication.DTOs.response.GetInforGroupResponse;
import service.communication.DTOs.response.GroupDetailResponse;
import service.communication.DTOs.response.GroupMessageResponse;
import service.communication.DTOs.response.PageResponse;
import service.communication.service.GroupService;

@RequiredArgsConstructor
@RestController
@RequestMapping("/groups")
@Slf4j
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class GroupController {
  GroupService groupService;

  @GetMapping("/all")
  HttpResponse<PageResponse<GetInforGroupResponse>>
  getAllGroups(@RequestParam(value = "page", defaultValue = "1") int page,
               @RequestParam(value = "size", defaultValue = "10") int size) {
    return HttpResponse.<PageResponse<GetInforGroupResponse>>builder()
        .code(1000)
        .message("Get all groups successfully")
        .result(groupService.getItemsGroup(page, size))
        .build();
  }

  @PostMapping("/request-join-group")
  HttpResponse<Void> requestJoinGroup(@RequestParam("groupId") String groupId) {
    groupService.pleaseAddGroup(groupId);
    return HttpResponse.<Void>builder()
        .code(1000)
        .message("Request to join group sent successfully")
        .build();
  }

  @GetMapping("/get-image/{groupId}")
  HttpResponse<String> getImageGroup(@PathVariable("groupId") String groupId) {
    return HttpResponse.<String>builder()
        .code(1000)
        .message("Get group image successfully")
        .result(groupService.getImageUrl(groupId))
        .build();
  }

  @PatchMapping("/modify-request-status")
  HttpResponse<Void>
  modifyRequestStatus(@RequestParam("requestId") String requestId,
                      @RequestParam("groupId") String groupId,
                      @RequestParam("accept") boolean accept) {
    groupService.modifyRequestJoin(requestId, groupId, accept);
    return HttpResponse.<Void>builder()
        .code(1000)
        .message("Modify request status successfully")
        .build();
  }

  @PostMapping("/create")
  HttpResponse<GetInforGroupResponse> createGroup(
      @RequestParam("groupName") String groupName,
      @RequestParam(value = "imageUrl", required = false) String imageUrl) {
    GetInforGroupResponse response =
        groupService.createGroup(groupName, imageUrl);
    return HttpResponse.<GetInforGroupResponse>builder()
        .code(1000)
        .message("Create group successfully")
        .result(response)
        .build();
  }

  @PatchMapping("/{groupId}")
  HttpResponse<GroupDetailResponse>
  updateGroup(@PathVariable("groupId") String groupId,
              @RequestBody UpdateGroupRequest request) {
    GroupDetailResponse response = groupService.updateGroup(groupId, request);
    return HttpResponse.<GroupDetailResponse>builder()
        .code(1000)
        .message("Update group successfully")
        .result(response)
        .build();
  }

  @PostMapping("/{groupId}/avatar")
  HttpResponse<String>
  uploadGroupAvatar(@PathVariable("groupId") String groupId,
                    @RequestPart("file") MultipartFile file) {
    String imageUrl = groupService.uploadGroupAvatar(groupId, file);
    return HttpResponse.<String>builder()
        .code(1000)
        .message("Upload group avatar successfully")
        .result(imageUrl)
        .build();
  }

  @GetMapping("/{groupId}")
  HttpResponse<GroupDetailResponse>
  getGroupDetail(@PathVariable("groupId") String groupId) {
    GroupDetailResponse response = groupService.getGroupDetail(groupId);
    return HttpResponse.<GroupDetailResponse>builder()
        .code(1000)
        .message("Get group detail successfully")
        .result(response)
        .build();
  }

  @GetMapping("/{groupId}/messages")
  HttpResponse<PageResponse<GroupMessageResponse>> getGroupMessages(
      @PathVariable("groupId") String groupId,
      @RequestParam(value = "page", defaultValue = "1") int page,
      @RequestParam(value = "size", defaultValue = "20") int size) {
    PageResponse<GroupMessageResponse> response =
        groupService.getGroupMessages(groupId, page, size);
    return HttpResponse.<PageResponse<GroupMessageResponse>>builder()
        .code(1000)
        .message("Get group messages successfully")
        .result(response)
        .build();
  }

  @DeleteMapping("/{groupId}/leave")
  HttpResponse<Void> leaveGroup(@PathVariable("groupId") String groupId) {
    groupService.leaveGroup(groupId);
    return HttpResponse.<Void>builder()
        .code(1000)
        .message("Left group successfully")
        .build();
  }

  @DeleteMapping("/{groupId}/members/{memberId}")
  HttpResponse<Void> removeMember(@PathVariable("groupId") String groupId,
                                  @PathVariable("memberId") String memberId) {
    groupService.removeMember(groupId, memberId);
    return HttpResponse.<Void>builder()
        .code(1000)
        .message("Member removed successfully")
        .build();
  }
}

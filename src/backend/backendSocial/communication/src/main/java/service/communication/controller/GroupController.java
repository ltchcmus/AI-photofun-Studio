package service.communication.controller;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import service.communication.DTOs.HttpResponse;
import service.communication.DTOs.response.GetInforGroupResponse;
import service.communication.entity.Group;
import service.communication.service.GroupService;

@RequiredArgsConstructor
@RestController
@RequestMapping("/groups")
@Slf4j
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Builder
@Data
public class GroupController {
    GroupService groupService;

    @PostMapping("/request-join-group")
    HttpResponse<Void> requestJoinGroup(String groupId){
        groupService.pleaseAddGroup(groupId);
        return HttpResponse.<Void>builder()
                .code(1000)
                .message("Request to join group sent successfully")
                .build();
    }

    @GetMapping("/get-image/{groupId}")
    HttpResponse<String> getImageGroup(String groupId) {
        return HttpResponse.<String>builder()
                .code(1000)
                .message("Get group image successfully")
                .result(groupService.getImageUrl(groupId))
                .build();
    }

    @PatchMapping("/modify-request-status")
    HttpResponse<Void> modifyRequestStatus(@RequestParam("requestId") String requestId,
                                           @RequestParam("groupId") String groupId,
                                           @RequestParam("accept") int status) {
        groupService.modifyRequestJoin(requestId, groupId, status);
        return HttpResponse.<Void>builder()
                .code(1000)
                .message("Modify request status successfully")
                .build();
    }

    @PostMapping("/create-group")
    HttpResponse<GetInforGroupResponse> createGroup(@RequestParam("groupName")  String groupName,
                                              @RequestParam(value = "imageUrl", required = false) String imageUrl) {
        GetInforGroupResponse response = groupService.createGroup(groupName, imageUrl);
        return HttpResponse.<GetInforGroupResponse>builder()
                .code(1000)
                .message("Create group successfully")
                .result(response)
                .build();
    }

}

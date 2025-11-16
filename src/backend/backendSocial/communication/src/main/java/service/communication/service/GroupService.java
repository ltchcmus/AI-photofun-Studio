package service.communication.service;

import java.time.Instant;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import service.communication.DTOs.request.UpdateGroupRequest;
import service.communication.DTOs.response.GetInforGroupResponse;
import service.communication.DTOs.response.GroupDetailResponse;
import service.communication.DTOs.response.GroupMessageResponse;
import service.communication.DTOs.response.PageResponse;
import service.communication.entity.Group;
import service.communication.entity.GroupMessage;
import service.communication.exception.AppException;
import service.communication.exception.ErrorCode;
import service.communication.mapper.GroupMapper;
import service.communication.mapper.GroupMessageMapper;
import service.communication.repository.GroupMessageRepository;
import service.communication.repository.GroupRepository;
import service.communication.repository.http.FileClient;
import service.communication.repository.http.IdentityClient;
import service.communication.utils.Utils;


@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Data
@Builder
@Slf4j
public class GroupService {
  GroupRepository groupRepository;
  GroupMessageRepository groupMessageRepository;
  GroupMapper groupMapper;
  GroupMessageMapper groupMessageMapper;
  IdentityClient identityClient;
  FileClient fileClient;
  Utils utils;

  @PreAuthorize("isAuthenticated()")
  public PageResponse<GetInforGroupResponse> getItemsGroup(int page, int size) {
    Pageable pageable = Pageable.ofSize(size).withPage(page - 1);
    Page<Group> pages = groupRepository.findAll(pageable);
    return PageResponse.<GetInforGroupResponse>builder()
        .items(pages.getContent()
                   .stream()
                   .map(groupMapper::toGetInforGroupResponse)
                   .toList())
        .totalItems(pages.getTotalElements())
        .totalPages(pages.getTotalPages())
        .currentPage(page)
        .build();
  }

  @PreAuthorize("isAuthenticated()")
  public void pleaseAddGroup(String groupId) {
    String requestId =
        SecurityContextHolder.getContext().getAuthentication().getName();
    Group group = groupRepository.findById(groupId).orElseThrow(
        () -> new AppException(ErrorCode.GROUP_NOT_FOUND));
    String adminId = group.getAdminId();
    var response = identityClient.requestJoinGroup(requestId, adminId, groupId);
    if (response.getCode() != 1000) {
      throw new AppException(ErrorCode.FAILED_TO_REQUEST_JOIN_GROUP);
    }
  }

  public String getImageUrl(String groupId) {
    Group group = groupRepository.findById(groupId).orElseThrow(
        () -> new AppException(ErrorCode.GROUP_NOT_FOUND));
    return group.getImage();
  }

  @PreAuthorize("isAuthenticated()")
  public void modifyRequestJoin(String requestId, String groupId, int accept) {
    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();
    Group group = groupRepository.findById(groupId).orElseThrow(
        () -> new AppException(ErrorCode.GROUP_NOT_FOUND));
    if (!group.getAdminId().equals(userId)) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }
    if (accept > 0) {
      group.getMemberIds().add(requestId);
      var response = identityClient.addGroup(requestId, groupId);
      if (response.getCode() != 1000) {
        throw new AppException(ErrorCode.FAILED_TO_ADD_GROUP);
      }
      groupRepository.save(group);
    }
    var response =
        identityClient.deleteRequestJoinGroup(userId, requestId, groupId);
    if (response.getCode() != 1000) {
      throw new AppException(ErrorCode.FAILED_TO_DELETE_REQUEST_JOIN_GROUP);
    }
  }

  @PreAuthorize("isAuthenticated()")
  public GetInforGroupResponse createGroup(String groupName, String imageUrl) {
    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();

    // Check premium
    var premiumResponse = identityClient.checkPremium(userId);
    if (premiumResponse.getCode() != 1000 || !premiumResponse.getResult()) {
      throw new AppException(ErrorCode.USER_NOT_PREMIUM);
    }

    Group group = Group.builder()
                      .name(groupName)
                      .image(imageUrl)
                      .adminId(userId)
                      .memberIds(new java.util.ArrayList<>())
                      .build();

    // Auto add admin to memberIds
    group.getMemberIds().add(userId);

    Group savedGroup = groupRepository.save(group);

    // Add group to user's groupsJoined
    var response = identityClient.addGroup(userId, savedGroup.getGroupId());
    if (response.getCode() != 1000) {
      // Rollback: delete group if failed to add to user
      groupRepository.delete(savedGroup);
      throw new AppException(ErrorCode.FAILED_TO_ADD_GROUP);
    }

    return groupMapper.toGetInforGroupResponse(savedGroup);
  }

  @PreAuthorize("isAuthenticated()")
  public GroupDetailResponse updateGroup(String groupId,
                                         UpdateGroupRequest request) {
    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();
    Group group = groupRepository.findById(groupId).orElseThrow(
        () -> new AppException(ErrorCode.GROUP_NOT_FOUND));

    // Only admin can update
    if (!group.getAdminId().equals(userId)) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    if (request.getName() != null && !request.getName().trim().isEmpty()) {
      group.setName(request.getName());
    }
    if (request.getDescription() != null) {
      group.setDescription(request.getDescription());
    }

    group.setUpdatedAt(Instant.now());
    Group updatedGroup = groupRepository.save(group);

    return GroupDetailResponse.builder()
        .groupId(updatedGroup.getGroupId())
        .name(updatedGroup.getName())
        .image(updatedGroup.getImage())
        .description(updatedGroup.getDescription())
        .adminId(updatedGroup.getAdminId())
        .memberCount(updatedGroup.getMemberIds().size())
        .createdAt(updatedGroup.getCreatedAt())
        .updatedAt(updatedGroup.getUpdatedAt())
        .build();
  }

  @PreAuthorize("isAuthenticated()")
  public String uploadGroupAvatar(String groupId, MultipartFile file) {
    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();
    Group group = groupRepository.findById(groupId).orElseThrow(
        () -> new AppException(ErrorCode.GROUP_NOT_FOUND));

    // Only admin can upload avatar
    if (!group.getAdminId().equals(userId)) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    // Upload file
    var uploadResponse = fileClient.uploadFile(file);
    if (uploadResponse.getCode() != 1000) {
      throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
    }

    String imageUrl = uploadResponse.getResult().getUrl();
    group.setImage(imageUrl);
    group.setUpdatedAt(Instant.now());
    groupRepository.save(group);

    return imageUrl;
  }

  @PreAuthorize("isAuthenticated()")
  public GroupDetailResponse getGroupDetail(String groupId) {
    Group group = groupRepository.findById(groupId).orElseThrow(
        () -> new AppException(ErrorCode.GROUP_NOT_FOUND));

    return GroupDetailResponse.builder()
        .groupId(group.getGroupId())
        .name(group.getName())
        .image(group.getImage())
        .description(group.getDescription())
        .adminId(group.getAdminId())
        .memberCount(group.getMemberIds().size())
        .createdAt(group.getCreatedAt())
        .updatedAt(group.getUpdatedAt())
        .build();
  }

  @PreAuthorize("isAuthenticated()")
  public PageResponse<GroupMessageResponse>
  getGroupMessages(String groupId, int page, int size) {
    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();
    Group group = groupRepository.findById(groupId).orElseThrow(
        () -> new AppException(ErrorCode.GROUP_NOT_FOUND));

    // Check if user is member of group
    if (!group.getMemberIds().contains(userId)) {
      throw new AppException(ErrorCode.NOT_GROUP_MEMBER);
    }

    Sort sort = Sort.by("timestamp").descending();
    Pageable pageable = PageRequest.of(page - 1, size, sort);
    Page<GroupMessage> messagesPage =
        groupMessageRepository.findByGroupId(groupId, pageable);

    return PageResponse.<GroupMessageResponse>builder()
        .currentPage(page)
        .totalPages(messagesPage.getTotalPages())
        .totalItems(messagesPage.getTotalElements())
        .items(messagesPage.getContent()
                   .stream()
                   .map(message -> {
                     GroupMessageResponse response =
                         groupMessageMapper.toGroupMessageResponse(message);
                     response.setTimestamp(
                         utils.formatTimestamp(message.getTimestamp()));
                     return response;
                   })
                   .toList())
        .build();
  }

  public void addGroupMessage(GroupMessage message) {
    groupMessageRepository.save(message);
  }
}

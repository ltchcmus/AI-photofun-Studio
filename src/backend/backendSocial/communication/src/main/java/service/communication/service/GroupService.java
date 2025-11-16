package service.communication.service;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import service.communication.DTOs.response.GetInforGroupResponse;
import service.communication.DTOs.response.PageResponse;
import service.communication.entity.Group;
import service.communication.exception.AppException;
import service.communication.exception.ErrorCode;
import service.communication.mapper.GroupMapper;
import service.communication.repository.GroupRepository;
import service.communication.repository.http.IdentityClient;

import static java.util.stream.Collectors.toList;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Data
@Builder
@Slf4j
public class GroupService {
    GroupRepository groupRepository;
    GroupMapper groupMapper;
    IdentityClient identityClient;

    @PreAuthorize("isAuthenticated()")
    public PageResponse<GetInforGroupResponse> getItemsGroup(int page, int size) {
        Pageable pageable = Pageable.ofSize(size).withPage(page - 1);
        Page<Group> pages = groupRepository.findAll(pageable);
        return PageResponse.<GetInforGroupResponse>builder()
                .items(pages.getContent().stream().map(
                        groupMapper::toGetInforGroupResponse
                ).toList())
                .totalItems(pages.getTotalElements())
                .totalPages(pages.getTotalPages())
                .currentPage(page)
                .build();
    }

    @PreAuthorize("isAuthenticated()")
    public void pleaseAddGroup(String groupId){
        String requestId = SecurityContextHolder.getContext().getAuthentication().getName();
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new AppException(ErrorCode.GROUP_NOT_FOUND));
        String adminId = group.getAdminId();
        var response =  identityClient.requestJoinGroup(requestId, adminId, groupId);
        if(response.getCode() != 1000){
            throw new AppException(ErrorCode.FAILED_TO_REQUEST_JOIN_GROUP);
        }
    }

    public String getImageUrl(String groupId){
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new AppException(ErrorCode.GROUP_NOT_FOUND));
        return group.getImage();
    }

    @PreAuthorize("isAuthenticated()")
    public void modifyRequestJoin(String requestId, String groupId, int accept){
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new AppException(ErrorCode.GROUP_NOT_FOUND));
        if(!group.getAdminId().equals(userId)){
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        if(accept > 0){
            group.getMemberIds().add(requestId);
            var response =  identityClient.addGroup(requestId, groupId);
            if(response.getCode() != 1000) {
                throw new AppException(ErrorCode.FAILED_TO_ADD_GROUP);
            }
            groupRepository.save(group);
        }
        var response =  identityClient.deleteRequestJoinGroup(userId, requestId, groupId);
        if(response.getCode() != 1000) {
            throw new AppException(ErrorCode.FAILED_TO_DELETE_REQUEST_JOIN_GROUP);
        }
    }

    GetInforGroupResponse createGroup(String groupName, String imageUrl){
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        Group group = Group.builder()
                .name(groupName)
                .image(imageUrl)
                .adminId(userId)
                .memberIds(new java.util.ArrayList<>())
                .build();
        groupRepository.save(group);
        return groupMapper.toGetInforGroupResponse(group);
    }

}

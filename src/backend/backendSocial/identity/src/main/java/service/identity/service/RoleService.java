package service.identity.service;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import service.identity.DTOs.request.CreateRoleRequest;
import service.identity.DTOs.response.CreateRoleResponse;
import service.identity.DTOs.response.RoleResponse;
import service.identity.entity.Role;
import service.identity.exception.AppException;
import service.identity.exception.ErrorCode;
import service.identity.helper.MapperHelper;
import service.identity.mapper.RoleMapper;
import service.identity.repository.RoleRepository;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class RoleService {
    RoleRepository roleRepository;
    RoleMapper roleMapper;
    MapperHelper mapperHelper;


    @PreAuthorize("hasRole('ADMIN')")
    public CreateRoleResponse create(CreateRoleRequest createRoleRequest){

        if(roleRepository.existsByRoleName(createRoleRequest.getRoleName())){
            throw new AppException(ErrorCode.ROLE_ALREADY_EXISTS);
        }

        Role role = roleMapper.toRole(createRoleRequest);
        role.setAuthorities(mapperHelper.mapAuthorityFromStings(createRoleRequest.getAuthorities()));
        CreateRoleResponse response = roleMapper.toCreateRoleResponse(roleRepository.save(role));
        response.setAuthorities(mapperHelper.mapAuthorityResponseFromAuthority(role.getAuthorities()));
        return response;
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<RoleResponse> getAll(){
        List<Role> roles = roleRepository.findAll();
        return roles.stream()
            .map(roleMapper::toRoleResponse)
            .map(rr -> RoleResponse.builder()
                .roleName(rr.getRoleName())
                .description(rr.getDescription())
                .authorities(mapperHelper.mapAuthorityResponseFromAuthority(
                    roles.stream()
                        .filter(r -> r.getRoleName().equals(rr.getRoleName()))
                        .findFirst()
                        .orElseThrow()
                        .getAuthorities()
                ))
                .build())
            .toList();
    }
}

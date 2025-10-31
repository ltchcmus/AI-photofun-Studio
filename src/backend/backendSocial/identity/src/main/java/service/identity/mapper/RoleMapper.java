package service.identity.mapper;


import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import service.identity.DTOs.request.CreateRoleRequest;
import service.identity.DTOs.response.CreateRoleResponse;
import service.identity.DTOs.response.RoleResponse;
import service.identity.entity.Role;

@Mapper(componentModel = "spring")
public interface  RoleMapper {

    @Mapping(target = "authorities", ignore = true)
    Role toRole(CreateRoleRequest createRoleRequest);

    @Mapping(target = "authorities", ignore = true)
    CreateRoleResponse toCreateRoleResponse(Role role);

    @Mapping(target = "authorities", ignore = true)
    RoleResponse toRoleResponse(Role role);

}

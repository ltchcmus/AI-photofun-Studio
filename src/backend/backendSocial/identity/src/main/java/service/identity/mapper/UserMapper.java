package service.identity.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import service.identity.DTOs.request.RegisterUserRequest;
import service.identity.DTOs.response.GetMeResponse;
import service.identity.DTOs.response.GetUserResponse;
import service.identity.DTOs.response.RegisterUserResponse;
import service.identity.entity.User;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "roles", ignore = true)
    User toUser(RegisterUserRequest registerUserRequest);
    @Mapping(target = "roles", ignore = true)
    RegisterUserResponse toRegisterUserResponse(User user);

    @Mapping(target = "roles", ignore = true)
    GetUserResponse toGetUserResponse(User user);

    GetMeResponse toGetMeResponse(User user);

}

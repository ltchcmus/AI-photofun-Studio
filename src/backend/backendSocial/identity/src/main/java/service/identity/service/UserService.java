package service.identity.service;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import service.identity.DTOs.request.RegisterUserRequest;
import service.identity.DTOs.response.GetUserResponse;
import service.identity.DTOs.response.RegisterUserResponse;
import service.identity.entity.User;
import service.identity.exception.AppException;
import service.identity.exception.ErrorCode;
import service.identity.helper.MapperHelper;
import service.identity.mapper.UserMapper;
import service.identity.repository.UserRepository;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class UserService {
    UserRepository userRepository;
    MapperHelper mapperHelper;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;


    public RegisterUserResponse register(RegisterUserRequest registerUserRequest){

        if(!registerUserRequest.getConfirmPass().equals(registerUserRequest.getPassword())){
            throw new AppException(ErrorCode.PASSWORDS_DO_NOT_MATCH);
        }

        if(userRepository.existsByUsername(registerUserRequest.getUsername())){
            throw new AppException(ErrorCode.USERNAME_ALREADY_EXISTS);
        }
        if(userRepository.existsByEmail(registerUserRequest.getEmail())){
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        // Map request to entity
        User user = userMapper.toUser(registerUserRequest);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRoles(mapperHelper.mapRoleFromStrings(registerUserRequest.getRoles()));

        // Save user to database
        User savedUser = userRepository.save(user);

        // Map entity to response
        RegisterUserResponse response = userMapper.toRegisterUserResponse(savedUser);
        response.setRoles(mapperHelper.mapRoleResponseFromRole(savedUser.getRoles()));
        return response;
    }

    @PostAuthorize("returnObject.userId == authentication.name or hasRole('ADMIN')")
    public GetUserResponse getUserById(String userId){
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        GetUserResponse response = userMapper.toGetUserResponse(user);
        response.setRoles(mapperHelper.mapRoleResponseFromRole(user.getRoles()));
        return response;
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<GetUserResponse> getAllUsers(){
        List<User> users = userRepository.findAll();
        return users.stream().map(user -> {
            GetUserResponse response = userMapper.toGetUserResponse(user);
            response.setRoles(mapperHelper.mapRoleResponseFromRole(user.getRoles()));
            return response;
        }).toList();
    }

}

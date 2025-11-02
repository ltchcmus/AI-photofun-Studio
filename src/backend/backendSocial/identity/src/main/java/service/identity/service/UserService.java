package service.identity.service;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.parameters.P;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import service.identity.DTOs.HttpResponse;
import service.identity.DTOs.request.ChangePasswordRequest;
import service.identity.DTOs.request.RegisterUserRequest;
import service.identity.DTOs.request.SetPasswordRequest;
import service.identity.DTOs.request.profile.ProfileCreateRequest;
import service.identity.DTOs.response.GetMeResponse;
import service.identity.DTOs.response.GetUserResponse;
import service.identity.DTOs.response.RegisterUserResponse;
import service.identity.DTOs.response.UploadAvatarResponse;
import service.identity.DTOs.response.file.UploadFileResponse;
import service.identity.entity.Role;
import service.identity.entity.User;
import service.identity.exception.AppException;
import service.identity.exception.ErrorCode;
import service.identity.helper.MapperHelper;
import service.identity.mapper.UserMapper;
import service.identity.repository.UserRepository;
import service.identity.repository.http.FileClient;
import service.identity.repository.http.ProfileClient;
import service.identity.utils.Utils;

import javax.print.attribute.standard.Media;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class UserService {
    UserRepository userRepository;
    MapperHelper mapperHelper;
    UserMapper userMapper;
    FileClient fileClient;
    PasswordEncoder passwordEncoder;
    ProfileClient profileClient;
    Utils utils;


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

        User user = userMapper.toUser(registerUserRequest);
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        Set<String> roleStrings = new HashSet<>(List.of("USER"));
        if(registerUserRequest.getRoles() != null) {
            roleStrings.addAll(registerUserRequest.getRoles());
        }
        Set<Role> roles = mapperHelper.mapRoleFromStrings(roleStrings);
        //roles.add(utils.getRoleDefault());
        user.setRoles(roles);

        User savedUser = userRepository.save(user);

        RegisterUserResponse response = userMapper.toRegisterUserResponse(savedUser);
        response.setRoles(mapperHelper.mapRoleResponseFromRole(savedUser.getRoles()));


        ProfileCreateRequest profileCreateRequest = ProfileCreateRequest.builder()
                .email(response.getEmail())
                .userId(response.getUserId())
                .fullName(registerUserRequest.getFullName())
                .build();

        try{
            profileClient.create(profileCreateRequest);
        }
        catch(Exception e){
            log.error("Error creating profile for user {}: {}", response.getUserId(), e.getMessage());
            userRepository.delete(user);
            throw new AppException(ErrorCode.FAILED_TO_CREATE_PROFILE);
        }
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


    @PostAuthorize("returnObject.userId == authentication.name or hasRole('ADMIN')")
    public GetMeResponse getMe(){
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return userMapper.toGetMeResponse(user);
    }

    @PreAuthorize("isAuthenticated()")
    public boolean changePassword(ChangePasswordRequest changePasswordRequest){
        String oldPassword = changePasswordRequest.getOldPassword();
        String newPassword = changePasswordRequest.getNewPassword();
        String confirmPassword = changePasswordRequest.getConfirmNewPassword();

        if(newPassword == null || newPassword.isEmpty() || confirmPassword == null
                || confirmPassword.isEmpty() || oldPassword == null || oldPassword.isEmpty()){
            throw new AppException(ErrorCode.CANT_BE_BLANK);
        }

        if(!newPassword.equals(confirmPassword)){
            throw new AppException(ErrorCode.PASSWORDS_DO_NOT_MATCH);
        }

        if(newPassword.equals(oldPassword)){
            throw new AppException(ErrorCode.NEW_PASSWORD_SAME_AS_OLD);
        }

        String userId = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        log.info("Changing password for user with userId = {}", user.getUserId());
        log.info("Changing password for user with username = {}", user.getUsername());

        // Verify old password matches current password in database
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new AppException(ErrorCode.OLD_PASSWORD_INCORRECT);
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return true;
    }

    @PreAuthorize("isAuthenticated()")
    public UploadAvatarResponse uploadAvatar(MultipartFile file){
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        HttpResponse<UploadFileResponse> response = fileClient.uploadFile(userId, file);
        if(response.getCode() != 1000){
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        }
        String avatarUrl = response.getResult().getImage();

        UploadAvatarResponse avatarResponse = UploadAvatarResponse.builder()
                .avatarUrl(avatarUrl)
                .build();

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);
        return avatarResponse;
    }

    @PreAuthorize("isAuthenticated()")
    public boolean likePost(String postId){
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Set<String> likedPosts = user.getLikedPosts();

        if(likedPosts.contains(postId)){
            likedPosts.remove(postId); // Unlike the post
        }
        else{
            likedPosts.add(postId); // Like the post
        }

        user.setLikedPosts(likedPosts);
        userRepository.save(user);
        return true;
    }

    @PreAuthorize("isAuthenticated()")
    public boolean checkLoginByGoogle(){
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return user.isLoginByGoogle();
    }

    @PreAuthorize("isAuthenticated()")
    public boolean setPassword(SetPasswordRequest request){
        String newPassword = request.getNewPassword();
        String confirmPassword = request.getConfirmPassword();
        if(newPassword == null || newPassword.isEmpty() || confirmPassword == null
                || confirmPassword.isEmpty()){
            throw new AppException(ErrorCode.CANT_BE_BLANK);
        }
        if(!newPassword.equals(confirmPassword)){
            throw new AppException(ErrorCode.PASSWORDS_DO_NOT_MATCH);
        }

        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if(!user.isLoginByGoogle()){
            throw new AppException(ErrorCode.USER_ALREADY_SET_PASSWORD);
        }
        user.setLoginByGoogle(false);
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return true;
    }


    @PreAuthorize("isAuthenticated()")
    public GetUserResponse getMyInfo() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return userMapper.toGetUserResponse(user);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUserById(String userId) {
        if (!userRepository.existsById(userId)) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        User user = userRepository.findById(userId).orElseThrow(()-> new AppException(ErrorCode.USER_NOT_FOUND));
        user.getRoles().clear();
        User saveUser = userRepository.save(user);
        userRepository.delete(saveUser);
    }
}

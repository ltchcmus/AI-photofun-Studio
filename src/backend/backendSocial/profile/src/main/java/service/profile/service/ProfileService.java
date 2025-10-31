package service.profile.service;


import service.profile.DTOs.request.ProfileCreateRequest;
import service.profile.DTOs.request.ProfileUpdateRequest;
import service.profile.DTOs.response.GetProfileResponse;
import service.profile.DTOs.response.ProfileCreateResponse;
import service.profile.DTOs.response.ProfileUpdateResponse;
import service.profile.entity.Profile;
import service.profile.exception.AppException;
import service.profile.exception.ErrorCode;
import service.profile.mapper.ProfileMapper;
import service.profile.repository.ProfileRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class ProfileService {
    ProfileRepository profileRepository;
    ProfileMapper profileMapper;


    public ProfileCreateResponse create(ProfileCreateRequest request){
        var profile = profileMapper.toProfile(request);
        var savedProfile = profileRepository.save(profile);
        return profileMapper.toProfileCreateResponse(savedProfile);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<GetProfileResponse> getAll(){
        return profileRepository.findAll().stream().map(profileMapper::toGetProfileResponse).toList();
    }

    public GetProfileResponse getById(){
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<Profile> profile = Optional.ofNullable(profileRepository.findById(userId).orElseThrow(
                () -> new AppException(ErrorCode.PROFILE_NOT_FOUND)
        ));
        return profileMapper.toGetProfileResponse(profile.get());
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void delete(String profileId){
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(()-> new AppException(ErrorCode.PROFILE_NOT_FOUND));
        profileRepository.delete(profile);
    }


    @PreAuthorize("hasRole('ADMIN') or isAuthenticated()")
    public ProfileUpdateResponse update(ProfileUpdateRequest profileUpdateRequest){
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<Profile> optionalProfile = Optional.ofNullable(profileRepository.findById(userId).orElseThrow(
                () -> new AppException(ErrorCode.PROFILE_NOT_FOUND)
        ));
        Profile profile = optionalProfile.get();
        if(profileUpdateRequest.getFullName() != null) {
            profile.setFullName(profileUpdateRequest.getFullName());
        }
        if(profileUpdateRequest.getAvatarUrl() != null){
            profile.setAvatarUrl(profileUpdateRequest.getAvatarUrl());
        }
        if(profileUpdateRequest.getPhone() != null){
            profile.setPhone(profileUpdateRequest.getPhone());
        }
        if(profileUpdateRequest.getEmail() != null){
            profile.setEmail(profileUpdateRequest.getEmail());
        }

        if(profileUpdateRequest.isVerified()){
            profile.setVerified(true);
        }

        profileRepository.save(profile);
        return profileMapper.toProfileUpdateResponse(profile);

    }

    public boolean checkVerify(){
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        Profile profile = profileRepository.findById(userId).orElseThrow((
                () -> new AppException(ErrorCode.PROFILE_NOT_FOUND)
        ));
        return profile.isVerified();
    }
}

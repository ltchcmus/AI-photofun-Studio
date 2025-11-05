package service.profile.mapper;


import org.mapstruct.Mapper;
import service.profile.DTOs.request.ProfileCreateRequest;
import service.profile.DTOs.response.GetProfileResponse;
import service.profile.DTOs.response.ProfileCreateResponse;
import service.profile.DTOs.response.ProfileUpdateResponse;
import service.profile.entity.Profile;

@Mapper(componentModel = "spring")
public interface ProfileMapper {
    Profile toProfile(ProfileCreateRequest request);
    ProfileCreateResponse toProfileCreateResponse(Profile profile);
    GetProfileResponse toGetProfileResponse(Profile profile);
    ProfileUpdateResponse toProfileUpdateResponse(Profile profile);
}

package service.profile.controller;


import service.profile.DTOs.HttpResponse;
import service.profile.DTOs.HttpCode;
import service.profile.DTOs.request.ProfileCreateRequest;
import service.profile.DTOs.request.ProfileUpdateRequest;
import service.profile.DTOs.response.GetProfileResponse;
import service.profile.DTOs.response.ProfileCreateResponse;
import service.profile.DTOs.response.ProfileUpdateResponse;
import service.profile.entity.Profile;
import service.profile.service.ProfileService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class ProfileController {

    ProfileService profileService;

    @PostMapping("/create")
    HttpResponse<ProfileCreateResponse> create(@RequestBody ProfileCreateRequest request){
        HttpResponse<ProfileCreateResponse> response = new HttpResponse<>(HttpCode.Success);
        response.setResult(profileService.create(request));
        return response;
    }

    @PutMapping("/update")
    HttpResponse<ProfileUpdateResponse> update(@RequestBody ProfileUpdateRequest request){
        HttpResponse<ProfileUpdateResponse> response = new HttpResponse<>(HttpCode.Success);
        response.setResult(profileService.update(request));
        return response;
    }


    @GetMapping("/my-profile")
    HttpResponse<GetProfileResponse> getById(){
        HttpResponse<GetProfileResponse> response = new HttpResponse<>(HttpCode.Success);
        response.setResult(profileService.getById());
        return response;
    }

    @DeleteMapping("/delete/{profileId}")
    HttpResponse<Void> delete(@PathVariable String profileId) {
        HttpResponse<Void> response = new HttpResponse<>(HttpCode.Success);
        profileService.delete(profileId);
        return response;
    }

    @GetMapping("/check-verify")
    HttpResponse<Boolean> checkVerify() {
        HttpResponse<Boolean> response = new HttpResponse<>(HttpCode.Success);
        response.setResult(profileService.checkVerify());
        return response;
    }

    @GetMapping("/verify-profile")
    HttpResponse<Void> verifyProfile(String userId) throws IOException {
        HttpResponse<Void> response = new HttpResponse<>(HttpCode.Success);
        profileService.verifyProfile();
        return response;
    }

    @GetMapping("/resend-verify-email")
    HttpResponse<Void> resendVerifyEmail() throws IOException {
        HttpResponse<Void> response = new HttpResponse<>(HttpCode.Success);
        profileService.verifyProfile();
        return response;
    }

    @PatchMapping("/activate-profile/{code}")
    HttpResponse<Boolean> activateProfile(@PathVariable("code") int code) {
        HttpResponse<Boolean> response = new HttpResponse<>(HttpCode.Success);
        boolean result = profileService.activateProfile(code);
        response.setResult(result);
        if(!result){
            response.setCode(HttpCode.InvalidActivationCode.getCode());
            response.setMessage("Invalid activation code");
        }
        return response;
    }

}

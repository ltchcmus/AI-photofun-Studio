package service.profile.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.locks.ReentrantLock;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import service.profile.DTOs.request.ProfileCreateRequest;
import service.profile.DTOs.request.ProfileUpdateRequest;
import service.profile.DTOs.request.mail.SendMailRequest;
import service.profile.DTOs.response.GetProfileResponse;
import service.profile.DTOs.response.ProfileCreateResponse;
import service.profile.DTOs.response.ProfileUpdateResponse;
import service.profile.entity.Profile;
import service.profile.exception.AppException;
import service.profile.exception.ErrorCode;
import service.profile.mapper.ProfileMapper;
import service.profile.repository.ProfileRepository;
import service.profile.repository.http.MailClient;


@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ProfileService {
  ProfileRepository profileRepository;
  ProfileMapper profileMapper;
  MailClient mailClient;

  @NonFinal ReentrantLock lock = new ReentrantLock();

  public ProfileCreateResponse create(ProfileCreateRequest request) {
    var profile = profileMapper.toProfile(request);
    var savedProfile = profileRepository.save(profile);
    return profileMapper.toProfileCreateResponse(savedProfile);
  }

  @PreAuthorize("hasRole('ADMIN')")
  public List<GetProfileResponse> getAll() {
    return profileRepository.findAll()
        .stream()
        .map(profileMapper::toGetProfileResponse)
        .toList();
  }

  public GetProfileResponse getById() {
    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();
    Optional<Profile> profile =
        Optional.ofNullable(profileRepository.findById(userId).orElseThrow(
            () -> new AppException(ErrorCode.PROFILE_NOT_FOUND)));
    return profileMapper.toGetProfileResponse(profile.get());
  }

  @PreAuthorize("hasRole('ADMIN')")
  public void delete(String profileId) {
    Profile profile = profileRepository.findById(profileId).orElseThrow(
        () -> new AppException(ErrorCode.PROFILE_NOT_FOUND));
    profileRepository.delete(profile);
  }

  @PreAuthorize("hasRole('ADMIN') or isAuthenticated()")
  public ProfileUpdateResponse
  update(ProfileUpdateRequest profileUpdateRequest) {
    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();
    Optional<Profile> optionalProfile =
        Optional.ofNullable(profileRepository.findById(userId).orElseThrow(
            () -> new AppException(ErrorCode.PROFILE_NOT_FOUND)));

    lock.lock();
    try {
      Profile profile = optionalProfile.get();
      if (profileUpdateRequest.getFullName() != null) {
        profile.setFullName(profileUpdateRequest.getFullName());
      }
      if (profileUpdateRequest.getAvatarUrl() != null) {
        profile.setAvatarUrl(profileUpdateRequest.getAvatarUrl());
      }
      if (profileUpdateRequest.getPhone() != null) {
        profile.setPhone(profileUpdateRequest.getPhone());
      }
      if (profileUpdateRequest.getEmail() != null) {
        profile.setEmail(profileUpdateRequest.getEmail());
      }

      if (profileUpdateRequest.isVerified()) {
        profile.setVerified(true);
      }

      profileRepository.save(profile);
      return profileMapper.toProfileUpdateResponse(profile);
    } finally {
      lock.unlock();
    }
  }

  public boolean checkVerify() {
    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();
    Profile profile = profileRepository.findById(userId).orElseThrow(
        (() -> new AppException(ErrorCode.PROFILE_NOT_FOUND)));
    return profile.isVerified();
  }

  @PreAuthorize("hasRole('ADMIN') or isAuthenticated()")
  public void verifyProfile() throws IOException {
    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();
    Profile profile = profileRepository.findById(userId).orElseThrow(
        () -> new AppException(ErrorCode.PROFILE_NOT_FOUND));

    ClassPathResource resource =
        new ClassPathResource("templates/VerifyCode.html");
    String html = new String(resource.getInputStream().readAllBytes(),
                             StandardCharsets.UTF_8);

    int codeInt = (int)(Math.random() * 9000) + 1000;
    String code = String.valueOf(codeInt);

    String fullName =
        profile.getFullName() == null ? "" : profile.getFullName();
    String name = fullName.isEmpty() ? profile.getUserId() : fullName;

    String content = html.replace("{{CODE}}", code).replace("{{NAME}}", name);

    log.info("content {}", content);

    profile.setCode(codeInt);
    profileRepository.save(profile);

    try {
      mailClient.sendMail(SendMailRequest.builder()
                              .toEmail(profile.getEmail())
                              .toName(name)
                              .subject("Verify your profile")
                              .content(content)
                              .build());
    } catch (Exception e) {
      log.info("Mail service is not working properly: " + e.getMessage());
      throw new AppException(ErrorCode.MAIL_SERVICE_ERROR);
    }
  }

  @PreAuthorize("hasRole('ADMIN') or isAuthenticated()")
  public boolean activateProfile(int code) {
    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();
    Profile profile = profileRepository.findById(userId).orElseThrow(
        (() -> new AppException(ErrorCode.PROFILE_NOT_FOUND)));
    if (profile.getCode() != code) {
      throw new AppException(ErrorCode.CODE_INVALID);
    }

    lock.lock();
    try {
      profile.setVerified(true);
      profileRepository.save(profile);
      return true;
    } finally {
      lock.unlock();
    }
  }
}

package service.identity.service;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import service.identity.DTOs.request.CreateAuthorityRequest;
import service.identity.DTOs.response.AuthorityResponse;
import service.identity.DTOs.response.CreateAuthorityResponse;
import service.identity.entity.Authority;
import service.identity.exception.AppException;
import service.identity.exception.ErrorCode;
import service.identity.mapper.AuthorityMapper;
import service.identity.repository.AuthorityRepository;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthorityService {
    AuthorityRepository authorityRepository;
    AuthorityMapper authorityMapper;

    @PreAuthorize("hasRole('ADMIN')")
    public CreateAuthorityResponse create(CreateAuthorityRequest createAuthorityRequest){
        if(authorityRepository.existsByAuthorityName(createAuthorityRequest.getAuthorityName())){
            throw new AppException(ErrorCode.AUTHORITY_ALREADY_EXISTS);
        }
        Authority authority = authorityMapper.toAuthority(createAuthorityRequest);
        return authorityMapper.toCreateAuthorityResponse(
            authorityRepository.save(authority)
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<AuthorityResponse> getAll(){

        List<Authority> authorities = authorityRepository.findAll();
        return authorities.stream()
            .map(authorityMapper::toAuthorityResponse)
            .map(ar -> AuthorityResponse.builder()
                .authorityName(ar.getAuthorityName())
                .description(ar.getDescription())
                .build())
            .toList();
    }
}

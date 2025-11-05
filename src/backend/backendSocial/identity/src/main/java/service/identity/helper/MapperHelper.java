package service.identity.helper;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import service.identity.DTOs.response.AuthorityResponse;
import service.identity.DTOs.response.RoleResponse;
import service.identity.entity.Authority;
import service.identity.entity.Role;
import service.identity.repository.AuthorityRepository;
import service.identity.repository.RoleRepository;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Component
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@Slf4j
@RequiredArgsConstructor
public class MapperHelper {
    RoleRepository roleRepository;
    AuthorityRepository authorityRepository;

    public Set<Authority> mapAuthorityFromStings(Set<String> authorityNames){
        Set<Authority> authorities = new HashSet<>();
        for(String authorityName : authorityNames){
            Optional<Authority> authority = authorityRepository.findById(authorityName);
            authority.ifPresent(authorities::add);

        }
        return authorities;
    }

    public Set<AuthorityResponse> mapAuthorityResponseFromAuthority(Set<Authority> authorities){
        Set<AuthorityResponse> authorityResponses = new HashSet<>();
        for(Authority authority : authorities){
            AuthorityResponse authorityResponse = AuthorityResponse.builder()
                    .authorityName(authority.getAuthorityName())
                    .description(authority.getDescription())
                    .build();
            authorityResponses.add(authorityResponse);
        }
        return authorityResponses;
    }

    public Set<Role> mapRoleFromStrings(Set<String> roleNames) {
        Set<Role> roles = new HashSet<>();
        for (String roleName : roleNames) {
            Optional<Role> role = roleRepository.findById(roleName);
            role.ifPresent(roles::add);
        }
        return roles;
    }


    public Set<RoleResponse> mapRoleResponseFromRole(Set<Role> roles){
        Set<RoleResponse> roleResponses = new HashSet<>();
        for(Role role : roles){
            RoleResponse roleResponse = RoleResponse.builder()
                    .roleName(role.getRoleName())
                    .description(role.getDescription())
                    .authorities(mapAuthorityResponseFromAuthority(role.getAuthorities()))
                    .build();
            roleResponses.add(roleResponse);
        }
        return roleResponses;
    }
}

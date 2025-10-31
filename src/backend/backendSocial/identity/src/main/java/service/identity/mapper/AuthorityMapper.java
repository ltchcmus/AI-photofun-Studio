package service.identity.mapper;

import org.mapstruct.Mapper;
import service.identity.DTOs.request.CreateAuthorityRequest;
import service.identity.DTOs.response.AuthorityResponse;
import service.identity.DTOs.response.CreateAuthorityResponse;
import service.identity.entity.Authority;

@Mapper(componentModel = "spring")
public interface AuthorityMapper {

    Authority toAuthority(CreateAuthorityRequest createAuthorityRequest);
    CreateAuthorityResponse toCreateAuthorityResponse(Authority authority);
    AuthorityResponse toAuthorityResponse(Authority authority);
}

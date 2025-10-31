package service.identity.controller;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;
import service.identity.DTOs.HttpResponse;
import service.identity.DTOs.request.CreateAuthorityRequest;
import service.identity.DTOs.response.AuthorityResponse;
import service.identity.DTOs.response.CreateAuthorityResponse;
import service.identity.service.AuthorityService;

import java.util.List;

@RestController
@RequestMapping("/authorities")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class AuthorityController {

    AuthorityService authorityService;
    @PostMapping("/create")
    HttpResponse<CreateAuthorityResponse> create(@RequestBody @Valid CreateAuthorityRequest createAuthorityRequest) {
        return HttpResponse.<CreateAuthorityResponse>builder()
            .result(authorityService.create(createAuthorityRequest))
            .message("Authority created successfully")
            .build();
    }

    @GetMapping("/get-all")
    HttpResponse<List<AuthorityResponse>> getAll(){
        return HttpResponse.<List<AuthorityResponse>>builder()
            .result(authorityService.getAll())
            .message("Authorities fetched successfully")
            .build();
    }

}

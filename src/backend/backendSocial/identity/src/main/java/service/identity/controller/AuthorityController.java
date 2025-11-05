package service.identity.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.bind.annotation.*;
import service.identity.DTOs.HttpResponse;
import service.identity.DTOs.request.CreateAuthorityRequest;
import service.identity.DTOs.response.AuthorityResponse;
import service.identity.DTOs.response.CreateAuthorityResponse;
import service.identity.service.AuthorityService;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/authorities")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class AuthorityController {

    AuthorityService authorityService;
    @PostMapping("/create")
    HttpResponse<CreateAuthorityResponse> create(@RequestBody @Valid CreateAuthorityRequest createAuthorityRequest) {
        return HttpResponse.<CreateAuthorityResponse>builder()
            .code(1000)
            .result(authorityService.create(createAuthorityRequest))
            .message("Authority created successfully")
            .build();
    }

    @GetMapping("/get-all")
    HttpResponse<List<AuthorityResponse>> getAll(HttpServletRequest httpServletRequest){

        log.info(httpServletRequest.getHeader("Authorization").split(" ")[1]);
        return HttpResponse.<List<AuthorityResponse>>builder()
                .code(1000)
                .result(authorityService.getAll())
                .message("Authorities fetched successfully")
                .build();
    }

}

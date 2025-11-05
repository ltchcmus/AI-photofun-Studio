package service.identity.controller;


import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;
import service.identity.DTOs.HttpResponse;
import service.identity.DTOs.request.CreateRoleRequest;
import service.identity.DTOs.response.CreateRoleResponse;
import service.identity.DTOs.response.RoleResponse;
import service.identity.service.RoleService;

import java.util.List;

@RestController
@RequestMapping("/roles")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class RoleController {
    RoleService roleService;

    @PostMapping("/create")
    HttpResponse<CreateRoleResponse> create(@RequestBody CreateRoleRequest request){
        return HttpResponse.<CreateRoleResponse>builder()
                .code(1000)
                .result(roleService.create(request))
                .message("Role created successfully")
                .build();
    }

    @GetMapping("/get-all")
    HttpResponse<List<RoleResponse>> getAll(){
        return HttpResponse.<List<RoleResponse>>builder()
                .code(1000)
                .result(roleService.getAll())
                .message("Roles fetched successfully")
                .build();
    }

}

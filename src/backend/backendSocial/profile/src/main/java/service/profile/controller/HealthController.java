package service.profile.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    @RequestMapping(value = "/check", method = org.springframework.web.bind.annotation.RequestMethod.HEAD)
    public org.springframework.http.ResponseEntity<Void> checkHealth() {
        return org.springframework.http.ResponseEntity.ok().build();
    }
}

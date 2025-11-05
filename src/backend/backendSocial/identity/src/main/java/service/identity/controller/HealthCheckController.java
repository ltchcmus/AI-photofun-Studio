package service.identity.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthCheckController {

    @RequestMapping(value = "/check", method = RequestMethod.HEAD)
    public ResponseEntity<Void> checkHealth() {
        return ResponseEntity.status(HttpStatus.OK).build();
    }
}

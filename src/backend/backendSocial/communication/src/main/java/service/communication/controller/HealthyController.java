package service.communication.controller;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthyController {

    @RequestMapping(value = "/healthy", method = RequestMethod.HEAD)
    public ResponseEntity<Void> healthy(HttpServletResponse response) {
        return ResponseEntity.status(HttpStatus.OK).build();
    }
}

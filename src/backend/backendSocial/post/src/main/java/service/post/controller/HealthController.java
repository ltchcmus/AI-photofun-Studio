package service.post.controller;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    @RequestMapping(value = "/check", method = RequestMethod.HEAD)
    public ResponseEntity<Void> checkHealth() {
        return ResponseEntity.ok().build();
    }
}

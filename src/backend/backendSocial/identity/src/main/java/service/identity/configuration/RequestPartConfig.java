package service.identity.configuration;

import feign.codec.Encoder;
import feign.form.spring.SpringFormEncoder;
import org.springframework.cloud.openfeign.support.SpringEncoder;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

@Component
public class RequestPartConfig {
    @Bean
    Encoder feignFormEncoder(){
        return new SpringFormEncoder();
    }
}

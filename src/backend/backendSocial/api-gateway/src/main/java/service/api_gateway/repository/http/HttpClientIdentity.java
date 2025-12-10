package service.api_gateway.repository.http;

import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.service.annotation.GetExchange;
import reactor.core.publisher.Mono;
import service.api_gateway.DTOs.response.IntrospectIgnoreRefreshResponse;
import service.api_gateway.DTOs.response.IntrospectRefreshResponse;
import service.api_gateway.exception.HttpResponse;


@Repository
public interface HttpClientIdentity {
    @GetMapping("/auth/introspect/access/{id}")
    Mono<HttpResponse<IntrospectIgnoreRefreshResponse>> introspectAccessToken(@PathVariable("id") String token);
    @GetExchange("/auth/introspect/refresh/{id}")
    Mono<HttpResponse<IntrospectRefreshResponse>> introspectRefreshToken(@PathVariable("id") String token);
    @GetExchange("/auth/refresh/{token}")
    Mono<HttpResponse<String>> refreshToken(@PathVariable("token") String token);
}

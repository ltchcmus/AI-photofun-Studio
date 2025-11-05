package service.api_gateway.repository.http;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.service.annotation.GetExchange;
import reactor.core.publisher.Mono;
import service.api_gateway.DTOs.response.IntrospectIgnoreRefreshResponse;
import service.api_gateway.DTOs.response.IntrospectRefreshResponse;
import service.api_gateway.exception.HttpResponse;

@Repository
public interface HttpClientIdentity {
    @GetExchange("/auth/introspect/ignore/{id}")
    Mono<HttpResponse<IntrospectIgnoreRefreshResponse>> introspectIgnoreRefresh(@PathVariable("id") String token);

    @GetExchange("/auth/introspect/{id}")
    Mono<HttpResponse<IntrospectRefreshResponse>> introspect(@PathVariable("id") String token);

    @GetExchange("/auth/refresh/{token}")
    Mono<HttpResponse<String>> refreshToken(@PathVariable("token") String token);
}

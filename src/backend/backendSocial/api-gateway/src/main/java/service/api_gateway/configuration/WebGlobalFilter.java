package service.api_gateway.configuration;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.apache.logging.log4j.util.Strings;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import service.api_gateway.repository.http.HttpClientIdentity;

@Component
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
class WebGlobalFilter implements GlobalFilter, Ordered {

    HttpClientIdentity httpClientIdentity;

    static final String[] PUBLIC_URLS = {
            "/identity/auth/login",
            "/identity/users/register",
            //"/posts/download/**",
            "/identity/auth/authentication",
            "/check",
            "/identity/users/tokens/**",
            "/identity/users/modify-tokens",
            "/identity/authorities/create",
            "/identity/roles/create",
            "/identity/auth/refresh-token"
    };

    @NonFinal
    @Value("${config.prefix}")
    private String prefix;

    @Override
    public int getOrder() {
        return -1;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String accessToken = exchange.getRequest().getHeaders().getFirst("Authorization");
        String path = exchange.getRequest().getPath().toString();
        for(String url : PUBLIC_URLS){
            String realPath = prefix + url;
            if(path.matches(realPath.replace("**", ".*"))){
                log.info("Public URL accessed: {}", path);
                return chain.filter(exchange);
            }
        }

        if(accessToken.isEmpty()){
            log.info("No Authorization header found");
            return unauthorized(exchange);
        }

        return chain.filter(exchange);
    }

    public Mono<Void> unauthorized(ServerWebExchange exchange){
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
        return response.writeWith(Mono.just(
                response.bufferFactory().wrap("{\"code\":401,\"message\":\"Unauthorized\"}".getBytes())
        ));
    }
}

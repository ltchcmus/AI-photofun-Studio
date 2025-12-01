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
            "/identity/roles/create"
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
        
        var cookies = exchange.getRequest().getCookies().getFirst("jwt");
        String token;
        if (cookies != null){
            token = cookies.getValue();
            var header = exchange.getRequest().mutate()
                    .header("Authorization", "Bearer " + token)
                    .build();
            exchange = exchange.mutate().request(header).build();
        } else {
            token = "";
        }

        String path = exchange.getRequest().getPath().toString();
        for(String url : PUBLIC_URLS){
            String realPath = prefix + url;
            if(path.matches(realPath.replace("**", ".*"))){
                log.info("Public URL accessed: {}", path);
                return chain.filter(exchange);
            }
        }

        if(token.isEmpty()){
            log.info("No token provided");
            return unauthorized(exchange);
        }


        log.info("Request Path: {}", path);
        ServerWebExchange finalExchange = exchange;

        return httpClientIdentity.introspect(token)
                .flatMap(isVerified -> {
                    if (!isVerified.getResult().isActive()) {
                        log.info("Token is not verified");
                        return unauthorized(finalExchange);
                    }

                    return httpClientIdentity.introspectIgnoreRefresh(token)
                            .flatMap(introspectResponse -> {
                                if (!introspectResponse.getResult().isActive()) {
                                    log.info("Token expired, trying refresh...");


                                    return httpClientIdentity.refreshToken(token)
                                            .flatMap(refreshResponse -> {
                                                if (refreshResponse.getResult() != Strings.EMPTY) {
                                                    String newToken = refreshResponse.getResult();
                                                    var newHeader = finalExchange.getRequest().mutate()
                                                            .header("Authorization", "Bearer " + newToken)
                                                            .build();
                                                    if (newToken == null) {
                                                        log.info("Refresh returned null token");
                                                        return unauthorized(finalExchange);
                                                    }
                                                    log.info("Refresh successful: {}", newToken);
                                                    return chain.filter(finalExchange.mutate().request(newHeader).build());
                                                } else {
                                                    log.info("Refresh failed");
                                                    return unauthorized(finalExchange);
                                                }
                                            });
                                } else {
                                    log.info("Token is verified");
                                    return chain.filter(finalExchange);
                                }
                            });
                });
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

package service.api_gateway.configuration;


import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
@Slf4j
class WebGlobalFilter implements GlobalFilter, Ordered {

    static final String[] PUBLIC_URLS = {

    };

    @Value("${config.prefix}")
    private String prefix;

    @Override
    public int getOrder() {
        return -1;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().toString();
        for(String url : PUBLIC_URLS){
            String realPath = prefix + "/" + url;
            if(path.contains(realPath)) return chain.filter(exchange);
        }
        log.info("Request Path: {}", path);

        return chain.filter(exchange);
    }
}
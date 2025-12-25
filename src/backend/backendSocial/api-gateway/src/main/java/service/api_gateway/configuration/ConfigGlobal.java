package service.api_gateway.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.support.WebClientAdapter;
import org.springframework.web.service.invoker.HttpExchangeAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;
import service.api_gateway.repository.http.HttpClientIdentity;

@Configuration
public class ConfigGlobal {

  @Value("${config.http.identity}") String identityServiceUrl;
  @Value("${cors.allowed.origins:http://localhost:5173,http://localhost:3000}")
  String allowedOrigins;

  @Bean
  @Order(Ordered.HIGHEST_PRECEDENCE)
  public CorsWebFilter corsWebFilter() {
    UrlBasedCorsConfigurationSource source =
        new UrlBasedCorsConfigurationSource();

    CorsConfiguration config = new CorsConfiguration();

    // Add allowed origins from environment variable or default to localhost
    String[] origins = allowedOrigins.split(",");
    for (String origin : origins) {
      config.addAllowedOrigin(origin.trim());
    }

    config.setAllowCredentials(true);
    config.addAllowedHeader("*");
    config.addAllowedMethod("*");
    config.addExposedHeader("X-Access-Token");
    config.addExposedHeader("Authorization");
    config.addExposedHeader("Content-Type");

    source.registerCorsConfiguration("/**", config);

    return new CorsWebFilter(source);
  }

  @Bean
  WebClient webClient() {
    return WebClient.builder().baseUrl(identityServiceUrl).build();
  }

  @Bean
  HttpClientIdentity httpClientIdentity() {
    // register proxy factory
    HttpServiceProxyFactory httpServiceProxyFactory =
        HttpServiceProxyFactory
            .builderFor(WebClientAdapter.create(
                webClient())) // Match webclient into factory
            .build();
    return httpServiceProxyFactory.createClient(HttpClientIdentity.class);
  }
}

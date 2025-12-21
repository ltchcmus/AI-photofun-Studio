package service.identity.configuration;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@Slf4j
public class SecurityGlobal {
  final String[] PUBLIC_URLS = {"/users/register",
                                "/introspect/**",
                                "/auth/login",
                                "/auth/introspect/**",
                                "/auth/refresh/**",
                                "/auth/introspect/ignore/**",
                                "/auth/authentication",
                                "/check",
                                "/users/tokens/**",
                                "/users/modify-tokens",
                                "/users/request-join-group",
                                "/users/delete-request-join-group",
                                "/users/add-group",
                                "/users/remove-group",
                                "/users/get-group-joined-internal",
                                "/users/check-premium",
                                "/authorities/create",
                                "/roles/create",
                                "/auth/refresh-token",
                                "/users/summaries"};

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

    http.csrf(AbstractHttpConfigurer::disable)
        .authorizeHttpRequests(request
                               -> request.requestMatchers(PUBLIC_URLS)
                                      .permitAll()
                                      .anyRequest()
                                      .authenticated())
        .oauth2ResourceServer(
            oauth2
            -> oauth2
                   .jwt(jwtConfigurer
                        -> jwtConfigurer.decoder(new CustomJwtDecoder())
                               .jwtAuthenticationConverter(
                                   jwtAuthenticationConverter()))
                   .bearerTokenResolver(cookieBearerTokenResolver())
                   .authenticationEntryPoint(new CustomEntryPoint()));

    return http.build();
  }

  @Bean
  public BearerTokenResolver cookieBearerTokenResolver() {
    return new BearerTokenResolver() {
      @Override
      public String resolve(HttpServletRequest request) {
        // First, try to get token from Authorization header (for access token)
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
          return authHeader.substring(7);
        }

        // Second, try to get refresh token from cookie (for refresh endpoints)
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
          for (Cookie cookie : cookies) {
            if ("jwt".equals(cookie.getName())) {
              return cookie.getValue();
            }
          }
        }

        return null;
      }
    };
  }

  @Bean
  public JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter =
        new JwtGrantedAuthoritiesConverter();

    // Don't add any prefix - token already has "ROLE_" in the value
    grantedAuthoritiesConverter.setAuthorityPrefix("");

    converter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
    return converter;
  }
}

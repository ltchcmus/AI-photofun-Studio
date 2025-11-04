package service.identity.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import service.identity.DTOs.HttpResponse;
import service.identity.exception.ErrorCode;

import java.io.IOException;

@Component
public class CustomEntryPoint implements AuthenticationEntryPoint {

    private static final String[] PUBLIC_URLS = {
            "/users/register",
            "/introspect",
            "/auth/login",
            "/auth/introspect",
            "/auth/refresh",
            "/auth/authentication"
    };

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException, ServletException {
        String requestUri = request.getRequestURI();


        for (String publicUrl : PUBLIC_URLS) {
            if (requestUri.contains(publicUrl)) {
                return;
            }
        }

        ErrorCode errorCode = ErrorCode.UNAUTHORIZED;
        response.setStatus(errorCode.getHttpStatus().value());
        ObjectMapper objectMapper = new ObjectMapper();

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        HttpResponse<?> httpResponse = HttpResponse.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();

        response.getWriter().write(objectMapper.writeValueAsString(httpResponse));
        response.flushBuffer();

    }
}

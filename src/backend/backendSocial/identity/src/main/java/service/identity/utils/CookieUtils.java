package service.identity.utils;

import service.identity.configuration.CookieConfig;
import jakarta.servlet.http.Cookie;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class CookieUtils {

    private final CookieConfig cookieConfig;

    public Cookie createJwtCookie(String token) {
        Cookie cookie = new Cookie("jwt", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieConfig.isSecure());
        cookie.setPath("/");
        cookie.setAttribute("SameSite", cookieConfig.getSameSite());

        if (StringUtils.hasText(cookieConfig.getDomain())) {
            cookie.setDomain(cookieConfig.getDomain());
        }

        return cookie;
    }

    public Cookie createExpiredJwtCookie() {
        Cookie cookie = new Cookie("jwt", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieConfig.isSecure());
        cookie.setPath("/");
        cookie.setMaxAge(0);
        cookie.setAttribute("SameSite", cookieConfig.getSameSite());

        if (StringUtils.hasText(cookieConfig.getDomain())) {
            cookie.setDomain(cookieConfig.getDomain());
        }

        return cookie;
    }
}

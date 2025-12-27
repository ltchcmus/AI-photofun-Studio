package service.identity.utils;

import jakarta.servlet.http.Cookie;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import service.identity.configuration.CookieConfig;


@Component
@RequiredArgsConstructor
public class CookieUtils {

  private final CookieConfig cookieConfig;

  public Cookie createJwtCookie(String token) {
    Cookie cookie = new Cookie("jwt", token);
    cookie.setHttpOnly(true);
    cookie.setSecure(cookieConfig.isSecure());
    cookie.setPath("/");
    cookie.setMaxAge(86400); // 24 hours (same as refresh token expiry)
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

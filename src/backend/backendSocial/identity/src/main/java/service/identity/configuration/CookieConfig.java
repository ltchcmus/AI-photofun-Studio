package service.identity.configuration;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "config.cookie")
public class CookieConfig {
    private boolean secure = false;
    private String sameSite = "Lax";
    private String domain = "";
}

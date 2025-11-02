package service.post.utils;

import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class Utils {

    public String convertInstantToString(Instant instant) {
        Instant now = Instant.now();
        long secondsAgo = now.getEpochSecond() - instant.getEpochSecond();
        if (secondsAgo < 60) {
            return secondsAgo + " seconds ago";
        } else if (secondsAgo < 3600) {
            long minutesAgo = secondsAgo / 60;
            return minutesAgo + " minutes ago";
        } else if (secondsAgo < 86400) {
            long hoursAgo = secondsAgo / 3600;
            return hoursAgo + " hours ago";
        } else {
            long daysAgo = secondsAgo / 86400;
            if(daysAgo < 5) {
                return daysAgo + " days ago";
            }
            return instant.toString();
        }
    }

}

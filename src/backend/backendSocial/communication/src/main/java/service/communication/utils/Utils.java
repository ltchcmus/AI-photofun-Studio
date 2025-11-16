package service.communication.utils;

import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
@FieldDefaults(level = AccessLevel.PRIVATE)
@Slf4j
@Data
public class Utils {

    public String generateMongoId(String first, String second){
        if(first.compareTo(second) < 0){
            return first + "__" + second;
        } else {
            return second + "__" + first;
        }
    }


    public String formatTimestamp(Instant timestamp){
        long seconds = Instant.now().getEpochSecond() - timestamp.getEpochSecond();
        if(seconds < 60){
            return seconds + " seconds ago";
        } else if(seconds < 3600){
            return (seconds / 60) + " minutes ago";
        } else if(seconds < 86400){
            return (seconds / 3600) + " hours ago";
        } else {
            int day = (int)(seconds / 86400);
            if(day < 4) {
                return day + " days ago";
            } else {
                return timestamp.toString().substring(0, 10);
            }
        }
    }
}

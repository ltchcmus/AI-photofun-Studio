package service.profile.DTOs;


import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public enum HttpCode {
    Success("1000", "Success"),
    Created("1001", "Created"),
    Failed("2002", "Failed"),
    Unauthorized("3001", "Unauthorized"),
    ;
    HttpCode(String code, String message){
        this.code = code;
        this.message = message;
    }
    String code;
    String message;
}

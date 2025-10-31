package service.profile.exception;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@RequiredArgsConstructor
public enum ErrorCode {
    INTERNAL_SERVER_ERROR("500","Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
    BAD_REQUEST("400","Bad Request", HttpStatus.BAD_REQUEST),
    PROFILE_NOT_FOUND("1010","Profile not found", HttpStatus.NOT_FOUND),
    UNAUTHORIZED("401","Unauthorized", HttpStatus.UNAUTHORIZED)
    ;
    String code;
    String message;
    HttpStatus httpStatus;
}

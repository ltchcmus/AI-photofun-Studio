package service.api_gateway.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
@Getter
public enum ErrorCode {
    USER_NOT_FOUND(1001, "User not found", HttpStatus.NOT_FOUND),
    INVALID_CREDENTIALS(1002, "Invalid credentials", HttpStatus.UNAUTHORIZED),
    ROLE_NOT_FOUND(1003, "Role not found", HttpStatus.NOT_FOUND),
    USER_ALREADY_EXISTS(1004, "User already exists", HttpStatus.CONFLICT),
    AUTHORITY_NAME_REQUIRED(1005, "Authority name is required", HttpStatus.BAD_REQUEST),
    ROLE_NAME_REQUIRED(1006, "Role name is required", HttpStatus.BAD_REQUEST)
    ;

    int code;
    String message;
    HttpStatus httpStatus;

    ErrorCode(int code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}

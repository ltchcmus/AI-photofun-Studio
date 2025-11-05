package service.identity.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
@Getter
public enum ErrorCode {
    USER_NOT_FOUND(1001, "User not found", HttpStatus.NOT_FOUND),
    INVALID_CREDENTIALS(1002, "Invalid credentials", HttpStatus.UNAUTHORIZED),
    ROLE_NOT_FOUND(1003, "Role not found", HttpStatus.NOT_FOUND),
    USER_ALREADY_EXISTS(1004, "User already exists", HttpStatus.CONFLICT),
    AUTHORITY_NAME_REQUIRED(1005, "Authority name is required", HttpStatus.BAD_REQUEST),
    ROLE_NAME_REQUIRED(1006, "Role name is required", HttpStatus.BAD_REQUEST),
    AUTHORITY_ALREADY_EXISTS(1007, "Authority already exists", HttpStatus.CONFLICT),
    ROLE_ALREADY_EXISTS(1008, "Role already exists", HttpStatus.CONFLICT),
    USERNAME_REQUIRED(1009, "Username is required", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1010, "Username is invalid, username must be least 5 characters and the most 20 characters", HttpStatus.BAD_REQUEST),
    PASSWORD_REQUIRED(1011, "Password is required", HttpStatus.BAD_REQUEST),
    PASSWORD_INVALID(1012, "Password is invalid, password must be least 4 characters and the most 30 characters", HttpStatus.BAD_REQUEST),
    TOKEN_EXPIRED(1013, "Token has expired", HttpStatus.UNAUTHORIZED),
    EMAIL_REQUIRED(1014, "Email is required", HttpStatus.BAD_REQUEST),
    USERNAME_ALREADY_EXISTS(1015, "Username already exists", HttpStatus.CONFLICT),
    EMAIL_ALREADY_EXISTS(1016, "Email already exists", HttpStatus.CONFLICT),
    PASSWORDS_DO_NOT_MATCH(1017, "Passwords do not match", HttpStatus.BAD_REQUEST),
    CONFIRM_PASSWORD_REQUIRED(1018, "Confirm password is required", HttpStatus.BAD_REQUEST),
    USERNAME_OR_EMAIL_REQUIRED(1019, "Username or email is required", HttpStatus.BAD_REQUEST),
    INCORRECT_ACCOUNT(1020, "Username/email or password are incorrect", HttpStatus.BAD_REQUEST),
    INTERNAL_SERVER_ERROR(1500, "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHORIZED(1501, "Unauthorized access", HttpStatus.UNAUTHORIZED),
    FAILED_TO_CREATE_PROFILE(1502, "Failed to create profile", HttpStatus.INTERNAL_SERVER_ERROR),
    OLD_PASSWORD_INCORRECT(1021, "Old password is incorrect", HttpStatus.BAD_REQUEST),
    CANT_BE_BLANK(1022, "Field can't be blank", HttpStatus.BAD_REQUEST),
    NEW_PASSWORD_SAME_AS_OLD(1023, "New password cannot be the same as the old password", HttpStatus.BAD_REQUEST),
    FILE_UPLOAD_FAILED(1024, "File upload failed", HttpStatus.INTERNAL_SERVER_ERROR),
    AUTHENTICATION_FAILED(1025, "Authentication failed", HttpStatus.UNAUTHORIZED),
    USER_ALREADY_SET_PASSWORD(1026, "User has already set a password", HttpStatus.BAD_REQUEST),

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

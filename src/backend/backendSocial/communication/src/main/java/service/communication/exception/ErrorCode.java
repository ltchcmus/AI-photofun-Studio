package service.communication.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
@Getter
public enum ErrorCode {
  USER_NOT_FOUND(1001, "User not found", HttpStatus.NOT_FOUND),
  INVALID_CREDENTIALS(1002, "Invalid credentials", HttpStatus.UNAUTHORIZED),
  ROLE_NOT_FOUND(1003, "Role not found", HttpStatus.NOT_FOUND),
  USER_ALREADY_EXISTS(1004, "User already exists", HttpStatus.CONFLICT),
  AUTHORITY_NAME_REQUIRED(1005, "Authority name is required",
                          HttpStatus.BAD_REQUEST),
  ROLE_NAME_REQUIRED(1006, "Role name is required", HttpStatus.BAD_REQUEST),
  AUTHORITY_ALREADY_EXISTS(1007, "Authority already exists",
                           HttpStatus.CONFLICT),
  ROLE_ALREADY_EXISTS(1008, "Role already exists", HttpStatus.CONFLICT),
  USERNAME_REQUIRED(1009, "Username is required", HttpStatus.BAD_REQUEST),
  USERNAME_INVALID(1010,
                   "Username is invalid, username must be least 5 characters "
                       + "and the most 20 characters",
                   HttpStatus.BAD_REQUEST),
  PASSWORD_REQUIRED(1011, "Password is required", HttpStatus.BAD_REQUEST),
  PASSWORD_INVALID(1012,
                   "Password is invalid, password must be least 4 characters "
                       + "and the most 30 characters",
                   HttpStatus.BAD_REQUEST),
  TOKEN_EXPIRED(1013, "Token has expired", HttpStatus.UNAUTHORIZED),
  EMAIL_REQUIRED(1014, "Email is required", HttpStatus.BAD_REQUEST),
  USERNAME_ALREADY_EXISTS(1015, "Username already exists", HttpStatus.CONFLICT),
  EMAIL_ALREADY_EXISTS(1016, "Email already exists", HttpStatus.CONFLICT),
  PASSWORDS_DO_NOT_MATCH(1017, "Passwords do not match",
                         HttpStatus.BAD_REQUEST),
  CONFIRM_PASSWORD_REQUIRED(1018, "Confirm password is required",
                            HttpStatus.BAD_REQUEST),
  USERNAME_OR_EMAIL_REQUIRED(1019, "Username or email is required",
                             HttpStatus.BAD_REQUEST),
  INCORRECT_ACCOUNT(1020, "Username/email or password are incorrect",
                    HttpStatus.BAD_REQUEST),
  INTERNAL_SERVER_ERROR(1500, "Internal server error",
                        HttpStatus.INTERNAL_SERVER_ERROR),
  UNAUTHORIZED(1501, "Unauthorized access", HttpStatus.UNAUTHORIZED),
  FAILED_TO_CREATE_PROFILE(1502, "Failed to create profile",
                           HttpStatus.INTERNAL_SERVER_ERROR),
  OLD_PASSWORD_INCORRECT(1021, "Old password is incorrect",
                         HttpStatus.BAD_REQUEST),
  CANT_BE_BLANK(1022, "Field can't be blank", HttpStatus.BAD_REQUEST),
  NEW_PASSWORD_SAME_AS_OLD(
      1023, "New password cannot be the same as the old password",
      HttpStatus.BAD_REQUEST),
  FILE_UPLOAD_FAILED(1024, "File upload failed",
                     HttpStatus.INTERNAL_SERVER_ERROR),
  AUTHENTICATION_FAILED(1025, "Authentication failed", HttpStatus.UNAUTHORIZED),
  USER_ALREADY_SET_PASSWORD(1026, "User has already set a password",
                            HttpStatus.BAD_REQUEST),
  LIMIT_REGISTER_EXCEEDED(1027, "Limit register exceeded",
                          HttpStatus.TOO_MANY_REQUESTS),
  SENDER_ID_EMPTY(2001, "Sender ID cannot be empty", HttpStatus.BAD_REQUEST),
  RECEIVER_ID_EMPTY(2002, "Receiver ID cannot be empty",
                    HttpStatus.BAD_REQUEST),
  MESSAGE_EMPTY(2003, "Message cannot be empty", HttpStatus.BAD_REQUEST),
  GROUP_NOT_FOUND(2004, "Group not found", HttpStatus.NOT_FOUND),
  FAILED_TO_REQUEST_JOIN_GROUP(2005, "Failed to request join group",
                               HttpStatus.INTERNAL_SERVER_ERROR),
  FAILED_TO_DELETE_REQUEST_JOIN_GROUP(2006,
                                      "Failed to delete request join group",
                                      HttpStatus.INTERNAL_SERVER_ERROR),
  FAILED_TO_ADD_GROUP(2007, "Failed to add group",
                      HttpStatus.INTERNAL_SERVER_ERROR),
  USER_NOT_PREMIUM(2008, "Only premium users can create groups",
                   HttpStatus.FORBIDDEN),
  DUPLICATE_GROUP_NAME(2009, "You already have a group with this name",
                       HttpStatus.CONFLICT),
  CANNOT_REQUEST_OWN_GROUP(2010, "You cannot request to join your own group",
                           HttpStatus.BAD_REQUEST),
  ALREADY_MEMBER(2011, "You are already a member of this group",
                 HttpStatus.BAD_REQUEST),
  NOT_GROUP_MEMBER(2012, "You are not a member of this group",
                   HttpStatus.FORBIDDEN),
  ADMIN_CANNOT_LEAVE_GROUP(
      2013,
      "Admin cannot leave their own group, please delete the group instead",
      HttpStatus.BAD_REQUEST),
  FAILED_TO_REMOVE_GROUP(2011, "Failed to remove group from user",
                         HttpStatus.INTERNAL_SERVER_ERROR),
  CANNOT_REMOVE_ADMIN(2012, "Cannot remove group admin",
                      HttpStatus.BAD_REQUEST),

  DONT_ADD_CONVERSATION(3001, "Cannot add conversation",
                        HttpStatus.INTERNAL_SERVER_ERROR),

  DONT_DELETE_CONVERSATION(3002, "Cannot delete conversation",
                           HttpStatus.INTERNAL_SERVER_ERROR),

  DONT_RETRIEVE_CONVERSATIONS(3003, "Cannot retrieve conversations",
                              HttpStatus.INTERNAL_SERVER_ERROR);

  int code;
  String message;
  HttpStatus httpStatus;

  ErrorCode(int code, String message, HttpStatus httpStatus) {
    this.code = code;
    this.message = message;
    this.httpStatus = httpStatus;
  }
}

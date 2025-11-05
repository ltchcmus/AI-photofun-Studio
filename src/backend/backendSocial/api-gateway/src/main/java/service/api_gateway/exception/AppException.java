package service.api_gateway.exception;


import lombok.Data;
import service.api_gateway.exception.ErrorCode;

@Data
public class AppException extends RuntimeException  {
    private ErrorCode errorCode;
    public AppException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}

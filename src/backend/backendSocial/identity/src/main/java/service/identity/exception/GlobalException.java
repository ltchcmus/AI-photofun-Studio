package service.identity.exception;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import service.identity.DTOs.HttpResponse;

@ControllerAdvice
public class GlobalException {

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    ResponseEntity<HttpResponse<?>> handleValidationException(MethodArgumentNotValidException exception) {
        String errorMessage = exception.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        ErrorCode errorCode = ErrorCode.valueOf(errorMessage);
        HttpResponse<?> httpResponse = HttpResponse.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();
        return ResponseEntity.status(errorCode.getHttpStatus()).body(httpResponse);
    }

    @ExceptionHandler(value = AppException.class)
    ResponseEntity<HttpResponse> handleAppException(AppException appException) {
        ErrorCode errorCode = appException.getErrorCode();
        HttpResponse httpResponse = HttpResponse.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();
        return ResponseEntity.status(errorCode.getHttpStatus()).body(httpResponse);
    }

}

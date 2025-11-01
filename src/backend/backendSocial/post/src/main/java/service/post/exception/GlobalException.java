package service.post.exception;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import service.post.DTOs.HttpResponse;
import service.post .exception.AppException;

@ControllerAdvice
public class GlobalException {

    @ExceptionHandler(value = RuntimeException.class)
    ResponseEntity<HttpResponse<?>> handleRuntimeException(RuntimeException exception) {
        HttpResponse<?> httpResponse = HttpResponse.builder()
                .code(ErrorCode.INTERNAL_SERVER_ERROR.getCode())
                .message(exception.getMessage())
                .build();
        return ResponseEntity.status(ErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus()).body(httpResponse);
    }

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

    @ExceptionHandler(value = Exception.class)
    ResponseEntity<HttpResponse<?>> handleException(Exception exception) {
        HttpResponse<?> httpResponse = HttpResponse.builder()
                .code(ErrorCode.INTERNAL_SERVER_ERROR.getCode())
                .message(exception.getMessage())
                .build();
        return ResponseEntity.status(ErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus()).body(httpResponse);
    }

}

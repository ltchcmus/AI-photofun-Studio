package service.profile.exception;


import service.profile.DTOs.HttpResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;


@RestControllerAdvice
public class GlobalException {

    @ExceptionHandler(value = AppException.class)
    ResponseEntity<HttpResponse<?>> handleAppException(AppException appException){
        ErrorCode errorCode = appException.getErrorCode();
        HttpResponse<?> httpResponse = HttpResponse.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();
        return ResponseEntity.status(errorCode.getHttpStatus()).body(httpResponse);
    }
    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    ResponseEntity<HttpResponse<?>> handleDefaultHandlerException(MethodArgumentNotValidException defaultHandlerExceptionResolver){
        HttpResponse<?> httpResponse = HttpResponse.builder()
                .code(ErrorCode.BAD_REQUEST.getCode())
                .message(ErrorCode.BAD_REQUEST.getMessage())
                .build();
        return ResponseEntity.status(ErrorCode.BAD_REQUEST.getHttpStatus()).body(httpResponse);
    }

    @ExceptionHandler(value = RuntimeException.class)
    ResponseEntity<HttpResponse<?>> handleRuntimeException(RuntimeException runtimeException){
        HttpResponse<?> httpResponse = HttpResponse.builder()
                .code(ErrorCode.INTERNAL_SERVER_ERROR.getCode())
                .message(runtimeException.getMessage())
                .build();
        return ResponseEntity.status(ErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus()).body(httpResponse);
    }

}

package service.profile.DTOs;


import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HttpResponse<T> {
    String code;
    String message;
    public HttpResponse(HttpCode httpCode){
        this.code = httpCode.getCode();
        this.message = httpCode.getMessage();
    }
    T result;
}

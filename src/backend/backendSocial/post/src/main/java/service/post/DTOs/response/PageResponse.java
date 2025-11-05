package service.post.DTOs.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Slf4j
@Builder
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PageResponse<T> {
    long totalElements;
    int totalPages;
    int currentPage;
    List<T> elements;
}

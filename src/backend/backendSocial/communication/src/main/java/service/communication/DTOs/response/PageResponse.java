package service.communication.DTOs.response;


import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Slf4j
public class PageResponse<T> {
    int currentPage;
    int totalPages;
    long totalItems;
    List<T> items;
}

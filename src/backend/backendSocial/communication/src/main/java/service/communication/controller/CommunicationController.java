package service.communication.controller;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import service.communication.DTOs.HttpResponse;
import service.communication.DTOs.response.GetMessageCoupleResponse;
import service.communication.DTOs.response.PageResponse;
import service.communication.service.CommunicationService;

@RequiredArgsConstructor
@RestController
@RequestMapping("/communications")
@Slf4j
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Builder
@Data
public class CommunicationController {

    CommunicationService communicationService;

    @GetMapping("/get-messages")
    HttpResponse<PageResponse<GetMessageCoupleResponse>> getMessages(@RequestParam("receiverId") String receiverId,
                                           @RequestParam(value = "page", defaultValue = "1") int page,
                                           @RequestParam(value = "size", defaultValue = "15") int size) {
        PageResponse<GetMessageCoupleResponse> pageResponse = communicationService.getPageMessage(receiverId, page, size);
        return HttpResponse.<PageResponse<GetMessageCoupleResponse>>builder()
                .result(pageResponse)
                .message("Messages retrieved successfully")
                .build();
    }

}

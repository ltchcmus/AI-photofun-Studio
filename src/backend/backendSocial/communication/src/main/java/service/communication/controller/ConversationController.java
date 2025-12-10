package service.communication.controller;

import java.util.List;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import service.communication.DTOs.HttpResponse;
import service.communication.DTOs.response.UserSummaryResponse;
import service.communication.service.ConversationService;


@RequiredArgsConstructor
@RestController
@RequestMapping("/conversations")
@Slf4j
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ConversationController {

  ConversationService conversationService;

  @GetMapping("/my-conversations")
  HttpResponse<List<UserSummaryResponse>> getUserConversation() {
    return HttpResponse.<List<UserSummaryResponse>>builder()
        .code(1000)
        .message("Get user conversations successfully")
        .result(this.conversationService.getUserConversations())
        .build();
  }

  @PostMapping("/add")
  HttpResponse<Void>
  addConversation(@RequestParam("receiverId") String receiverId) {
    conversationService.addConversation(receiverId);
    return HttpResponse.<Void>builder()
        .code(1000)
        .message("Conversation added successfully")
        .build();
  }

  @DeleteMapping("/delete")
  HttpResponse<Void>
  deleteConversation(@RequestParam("receiverId") String receiverId) {
    conversationService.deleteConversation(receiverId);
    return HttpResponse.<Void>builder()
        .code(1000)
        .message("Conversation deleted successfully")
        .build();
  }
}

package service.communication.repository.http;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
import service.communication.DTOs.HttpResponse;
import service.communication.DTOs.response.UploadFileResponse;

@FeignClient(name = "file-client", url = "${config.http.file}")
public interface FileClient {
  @PostMapping(value = "/api/v1/file/upload",
               consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  HttpResponse<UploadFileResponse>
  uploadFile(@RequestPart("file") MultipartFile file);
}

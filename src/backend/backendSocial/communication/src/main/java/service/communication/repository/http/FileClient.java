package service.communication.repository.http;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
import service.communication.DTOs.HttpResponse;
import service.communication.DTOs.response.UploadFileResponse;
import service.communication.configuration.RequestPartConfig;

@FeignClient(name = "file-client", url = "${config.http.file}",
             configuration = {RequestPartConfig.class})
public interface FileClient {
  @PostMapping(value = "/api/v1/file/uploads",
               consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  HttpResponse<UploadFileResponse>
  uploadFile(@RequestPart("id") String id,
             @RequestPart("image") MultipartFile image);
}

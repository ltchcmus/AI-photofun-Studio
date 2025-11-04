package service.post.repository.http;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
import service.post.DTOs.HttpResponse;
import service.post.DTOs.response.file.UploadFileResponse;
import service.post.configuration.RequestPartConfig;



@FeignClient(name = "file-service", url = "${config.http.file}", configuration = {RequestPartConfig.class})
public interface FileClient {
    @PostMapping(value = "/api/v1/file/uploads", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    HttpResponse<UploadFileResponse> uploadFile(
            @RequestPart("id") String id,
            @RequestPart("image") MultipartFile image
    );

    @DeleteMapping(value = "/api/v1/file/delete/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    HttpResponse<Void> deleteFile(@PathVariable("id") String id);
}

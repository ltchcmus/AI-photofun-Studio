package service.identity.repository.http;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
import service.identity.DTOs.HttpResponse;
import service.identity.DTOs.response.file.UploadFileResponse;
import service.identity.configuration.RequestPartConfig;

@FeignClient(name = "file-client", url = "${config.http.file}",configuration = {RequestPartConfig.class})
public interface FileClient {

    @PostMapping(value = "/api/v1/file/uploads", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    HttpResponse<UploadFileResponse> uploadFile(
            @RequestPart("id") String id,
            @RequestPart("image")MultipartFile image
            );

}

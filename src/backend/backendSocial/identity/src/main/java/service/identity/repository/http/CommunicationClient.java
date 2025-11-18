package service.identity.repository.http;

import org.springframework.cloud.openfeign.FeignClient;

@FeignClient(name = "communication-service", url = "${config.http.communication}")
public interface CommunicationClient {

}

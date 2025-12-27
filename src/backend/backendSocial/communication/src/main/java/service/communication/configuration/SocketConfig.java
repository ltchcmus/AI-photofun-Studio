package service.communication.configuration;

import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SocketConfig {

  @Value("${config.socket.host}") private String host;
  @Value("${config.socket.port}") private int port;

  @Bean
  SocketIOServer socketIOServer() {
    com.corundumstudio.socketio.Configuration config =
        new com.corundumstudio.socketio.Configuration();
    config.setHostname(host);
    config.setPort(port);

    // CORS configuration - Allow all origins for Socket.IO
    config.setOrigin("*");
    config.setAllowCustomRequests(true);
    config.setMaxFramePayloadLength(1024 * 1024); // 1MB
    config.setMaxHttpContentLength(1024 * 1024);  // 1MB

    return new SocketIOServer(config);
  }

  @Bean
  public ApplicationRunner runner(SocketIOServer socketIOServer) {
    return args -> { socketIOServer.start(); };
  }
}

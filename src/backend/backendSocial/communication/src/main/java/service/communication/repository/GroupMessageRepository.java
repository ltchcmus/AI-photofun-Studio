package service.communication.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import service.communication.entity.GroupMessage;

@Repository
public interface GroupMessageRepository
    extends MongoRepository<GroupMessage, String> {
  @Query("{'groupId': ?0}")
  Page<GroupMessage> findByGroupId(String groupId, Pageable pageable);
}

package service.communication.repository;

import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import service.communication.entity.Group;

@Repository
public interface GroupRepository extends MongoRepository<Group, String> {
  Optional<Group> findByAdminIdAndName(String adminId, String name);
}

package service.communication.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.DeleteQuery;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import service.communication.entity.Conversation;


@Repository
public interface ConversationRepository
    extends MongoRepository<Conversation, String> {
  @Query("{ '$or': [ { 'userIdA': ?0 }, { 'userIdB': ?0 } ] }")
  List<Conversation> findByUserId(String userId);

  @Query("{ '$or': [ { 'userIdA': ?0, 'userIdB': ?1 }, { 'userIdA': ?1, " +
         "'userIdB': ?0 } ] }")
  Optional<Conversation>
  findByUserIds(String userIdA, String userIdB);

  @DeleteQuery("{ '$or': [ { 'userIdA': ?0, 'userIdB': ?1 }, { 'userIdA': " +
               "?1, 'userIdB': ?0 } ] }")
  void
  deleteByUserIds(String userIdA, String userIdB);
}

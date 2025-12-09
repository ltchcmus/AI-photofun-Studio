package service.identity.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import service.identity.entity.Like;


@Repository
public interface LikeRepository extends JpaRepository<Like, String> {

  // Tìm like theo userId và postId
  Optional<Like> findByUserIdAndPostId(String userId, String postId);

  // Check xem user đã like post chưa
  boolean existsByUserIdAndPostId(String userId, String postId);

  // Xóa like theo userId và postId
  void deleteByUserIdAndPostId(String userId, String postId);

  // Đếm số lượng likes của một post
  long countByPostId(String postId);

  // Đếm số lượng likes của một user
  long countByUserId(String userId);

  // Lấy tất cả likes của một user
  List<Like> findByUserId(String userId);

  // Lấy tất cả likes của một post
  List<Like> findByPostId(String postId);

  // Check nhiều posts cùng lúc (cho API check-liked-posts)
  @Query("SELECT l.postId FROM Like l WHERE l.userId = :userId AND l.postId " +
         "IN :postIds")
  List<String>
  findLikedPostIdsByUserIdAndPostIds(@Param("userId") String userId,
                                     @Param("postIds") List<String> postIds);
}

package service.post.repository;

import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import service.post.entity.Post;

@Repository
public interface PostRepository extends JpaRepository<Post, String> {
    Page<Post> findAllByUserId(String userId, Pageable pageable);

    @Modifying
    @Query(
            value = "UPDATE post SET likes = GREATEST(0, likes + :number) WHERE post_id = :postId",
            nativeQuery = true
    )
    void addNumberLikes(@Param("postId") String postId, @Param("number") int number);

}

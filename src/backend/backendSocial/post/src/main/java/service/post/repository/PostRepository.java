package service.post.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import service.post.entity.Post;

@Repository
public interface PostRepository extends JpaRepository<Post, String> {
    Page<Post> findAllByUserId(String userId, Pageable pageable);
}

package service.identity.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import service.identity.entity.RemoveToken;

@Repository
public interface RemoveTokenRepository extends JpaRepository<RemoveToken, String> {
    boolean existsByToken(String token);
}

package service.identity.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import service.identity.entity.Authority;

@Repository
public interface AuthorityRepository extends JpaRepository<Authority, String> {
    boolean existsByAuthorityName(String authorityName);
}

package service.identity.repository;


import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import service.identity.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    boolean existsByUsername(@NotBlank(message = "USERNAME_REQUIRED") String username);

    boolean existsByEmail(@NotBlank(message = "EMAIL_REQUIRED") String email);

    User findByUsernameOrEmail(String username, String email);

    User findByUsername(String username);
}

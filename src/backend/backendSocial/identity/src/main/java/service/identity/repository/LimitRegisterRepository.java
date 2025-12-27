package service.identity.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import service.identity.entity.LimitRegister;

@Repository
public interface LimitRegisterRepository extends JpaRepository<LimitRegister, String> {
}

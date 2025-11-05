package service.profile.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import service.profile.entity.Profile;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, String> {
}

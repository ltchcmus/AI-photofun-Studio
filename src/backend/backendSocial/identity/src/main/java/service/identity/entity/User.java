package service.identity.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Entity
@Getter
@Setter
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "users")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

  @Id @GeneratedValue(strategy = GenerationType.UUID) String userId;

  @Column(unique = true, nullable = false) String username;

  @Column(nullable = false) String password;

  @Builder.Default List<String> memberRequests = new ArrayList<>();

  @Builder.Default List<String> groupsJoined = new ArrayList<>();

  @Column(unique = true, nullable = false) String email;

  @Column(nullable = true, length = 300) String avatarUrl;

  @ManyToMany(fetch = FetchType.EAGER) Set<Role> roles;

  @Builder.Default boolean loginByGoogle = false;

  @Builder.Default int premiumPoints = 0;

  @Builder.Default boolean premiumOneMonth = false;

  @Builder.Default boolean premiumSixMonths = false;

  @Builder.Default int tokens = 1000;

  @Builder.Default Instant createdAt = Instant.now();

  @Builder.Default Instant lastRefillAt = Instant.now();

}

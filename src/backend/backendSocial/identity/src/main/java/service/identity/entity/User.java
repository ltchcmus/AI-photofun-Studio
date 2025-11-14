package service.identity.entity;


import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

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

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String userId;

    @Column(unique = true, nullable = false)
    String username;

    @Column(nullable = false)
    String password;

    @Column(unique = true, nullable = false)
    String email;

    @Column(nullable = true, length = 300)
    String avatarUrl;

    @ManyToMany
    Set<Role> roles;

    @Builder.Default
    boolean loginByGoogle = false;

    @Builder.Default
    int premiumPoints = 0;

    @Builder.Default
    boolean premiumOneMonth = false;

    @Builder.Default
    boolean premiumSixMonths = false;

    @Builder.Default
    int tokens = 1000;

    @Builder.Default
    Instant createdAt = Instant.now();

    @Builder.Default
    Instant lastRefillAt = Instant.now();

    @Builder.Default
    Set<String> likedPosts = new HashSet<>();

}

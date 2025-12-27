CREATE TABLE users
(
    user_id            VARCHAR(255) NOT NULL,
    username           VARCHAR(255) NOT NULL,
    password           VARCHAR(255) NOT NULL,
    member_requests UNKNOWN__JAVA.UTIL.LIST<JAVA.LANG.STRING> NULL,
    groups_joined UNKNOWN__JAVA.UTIL.LIST<JAVA.LANG.STRING> NULL,
    email              VARCHAR(255) NOT NULL,
    avatar_url         VARCHAR(300) NULL,
    login_by_google    BIT(1)       NOT NULL,
    premium_points     INT          NOT NULL,
    premium_one_month  BIT(1)       NOT NULL,
    premium_six_months BIT(1)       NOT NULL,
    tokens             INT          NOT NULL,
    created_at         datetime     NULL,
    last_refill_at     datetime     NULL,
    CONSTRAINT pk_users PRIMARY KEY (user_id)
);

CREATE TABLE users_roles
(
    user_user_id    VARCHAR(255) NOT NULL,
    roles_role_name VARCHAR(255) NOT NULL,
    CONSTRAINT pk_users_roles PRIMARY KEY (user_user_id, roles_role_name)
);

ALTER TABLE users
    ADD CONSTRAINT uc_users_email UNIQUE (email);

ALTER TABLE users
    ADD CONSTRAINT uc_users_username UNIQUE (username);

ALTER TABLE users_roles
    ADD CONSTRAINT fk_userol_on_role FOREIGN KEY (roles_role_name) REFERENCES roles (role_name);

ALTER TABLE users_roles
    ADD CONSTRAINT fk_userol_on_user FOREIGN KEY (user_user_id) REFERENCES users (user_id);
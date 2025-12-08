CREATE TABLE profile
(
    user_id    VARCHAR(255) NOT NULL,
    full_name  VARCHAR(255) NULL,
    phone      VARCHAR(255) NULL,
    email      VARCHAR(255) NULL,
    age        INT          NOT NULL,
    code       INT          NOT NULL,
    verified   BIT(1)       NOT NULL,
    avatar_url VARCHAR(255) NULL,
    CONSTRAINT pk_profile PRIMARY KEY (user_id)
);
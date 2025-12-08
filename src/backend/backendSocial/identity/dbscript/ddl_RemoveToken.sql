CREATE TABLE remove_tokens
(
    token     VARCHAR(3000) NOT NULL,
    remove_at datetime      NULL,
    CONSTRAINT pk_remove_tokens PRIMARY KEY (token)
);
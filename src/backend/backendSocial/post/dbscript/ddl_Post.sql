CREATE TABLE posts
(
    post_id    VARCHAR(255) NOT NULL,
    user_id    VARCHAR(255) NOT NULL,
    caption    VARCHAR(255) NULL,
    image_url  VARCHAR(255) NULL,
    prompt     VARCHAR(255) NULL,
    likes      BIGINT       NOT NULL,
    comments   BIGINT       NOT NULL,
    created_at datetime     NULL,
    CONSTRAINT pk_posts PRIMARY KEY (post_id)
);
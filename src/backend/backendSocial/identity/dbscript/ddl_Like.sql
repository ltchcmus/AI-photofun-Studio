CREATE TABLE likes
(
    like_id    VARCHAR(255) NOT NULL,
    user_id    VARCHAR(255) NOT NULL,
    post_id    VARCHAR(255) NOT NULL,
    created_at datetime     NOT NULL,
    CONSTRAINT pk_likes PRIMARY KEY (like_id)
);

ALTER TABLE likes
    ADD CONSTRAINT uc_88d5108ea5e46ca11e828b43e UNIQUE (user_id, post_id);

CREATE INDEX idx_post_id ON likes (post_id);

CREATE INDEX idx_user_id ON likes (user_id);
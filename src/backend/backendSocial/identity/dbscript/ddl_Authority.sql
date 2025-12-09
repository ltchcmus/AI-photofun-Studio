CREATE TABLE authorities
(
    authority_name VARCHAR(255) NOT NULL,
    `description`  VARCHAR(255) NULL,
    CONSTRAINT pk_authorities PRIMARY KEY (authority_name)
);
CREATE TABLE roles
(
    role_name     VARCHAR(255) NOT NULL,
    `description` VARCHAR(255) NULL,
    CONSTRAINT pk_roles PRIMARY KEY (role_name)
);

CREATE TABLE roles_authorities
(
    role_role_name             VARCHAR(255) NOT NULL,
    authorities_authority_name VARCHAR(255) NOT NULL,
    CONSTRAINT pk_roles_authorities PRIMARY KEY (role_role_name, authorities_authority_name)
);

ALTER TABLE roles_authorities
    ADD CONSTRAINT fk_rolaut_on_authority FOREIGN KEY (authorities_authority_name) REFERENCES authorities (authority_name);

ALTER TABLE roles_authorities
    ADD CONSTRAINT fk_rolaut_on_role FOREIGN KEY (role_role_name) REFERENCES roles (role_name);
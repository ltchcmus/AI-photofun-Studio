CREATE TABLE limit_register
(
    client_ip      VARCHAR(255) NOT NULL,
    register_count INT          NOT NULL,
    CONSTRAINT pk_limitregister PRIMARY KEY (client_ip)
);
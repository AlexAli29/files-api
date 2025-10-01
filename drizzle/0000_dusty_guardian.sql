CREATE TABLE `users` (
	`id` varchar(64) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`)
);

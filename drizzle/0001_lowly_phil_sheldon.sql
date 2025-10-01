CREATE TABLE `files` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`ext` varchar(20) NOT NULL,
	`mime` varchar(127) NOT NULL,
	`path` varchar(255) NOT NULL,
	`size` int NOT NULL,
	`uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `files_id` PRIMARY KEY(`id`)
);

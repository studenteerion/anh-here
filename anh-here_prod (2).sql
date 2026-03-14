-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Creato il: Gen 29, 2026 alle 18:22
-- Versione del server: 10.4.32-MariaDB
-- Versione PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `anh-here_prod`
--

-- --------------------------------------------------------

--
-- Struttura della tabella `anomalies`
--

CREATE TABLE `anomalies` (
  `id` int(11) NOT NULL,
  `description` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `reporter_id` int(11) NOT NULL,
  `resolver_id` int(11) DEFAULT NULL,
  `status` enum('open','in_progress','closed') DEFAULT 'open',
  `resolution_notes` text DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `attendances`
--

CREATE TABLE `attendances` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `shift_id` int(11) NOT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `attendances`
--

INSERT INTO `attendances` (`id`, `employee_id`, `shift_id`, `start_datetime`, `end_datetime`) VALUES
(2, 1, 1, '2026-01-28 08:00:00', '2026-01-28 14:00:00'),
(3, 1, 1, '2026-01-29 07:58:00', NULL),
(4, 23, 2, '2026-01-28 14:00:00', '2026-01-28 20:05:00'),
(5, 23, 2, '2026-01-29 13:55:00', NULL),
(6, 24, 4, '2026-01-28 09:00:00', '2026-01-28 18:00:00'),
(7, 24, 4, '2026-01-29 08:50:00', '2026-01-29 17:55:00');

-- --------------------------------------------------------

--
-- Struttura della tabella `company_reports`
--

CREATE TABLE `company_reports` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `link` varchar(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `departments`
--

CREATE TABLE `departments` (
  `id` int(11) NOT NULL,
  `department_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `departments`
--

INSERT INTO `departments` (`id`, `department_name`) VALUES
(1, 'administration'),
(2, 'HR'),
(3, 'IT'),
(4, 'Logistics'),
(5, 'Sales');

-- --------------------------------------------------------

--
-- Struttura della tabella `employees`
--

CREATE TABLE `employees` (
  `id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `role_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `employees`
--

INSERT INTO `employees` (`id`, `first_name`, `last_name`, `role_id`, `department_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Daniele', 'Gamba', 3, 1, 'active', '2026-01-06 18:57:13', '2026-01-16 09:21:28'),
(23, 'Tommaso', 'Lavelli', 2, 3, 'active', '2026-01-23 09:27:26', '2026-01-23 09:27:26'),
(24, 'Davide', 'Villa', 1, 3, 'inactive', '2026-01-23 09:27:58', '2026-01-23 09:28:25');

-- --------------------------------------------------------

--
-- Struttura della tabella `leave_requests`
--

CREATE TABLE `leave_requests` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `request_date` datetime DEFAULT current_timestamp(),
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `type` enum('sick','vacation','personal','other') NOT NULL,
  `motivation` text DEFAULT NULL,
  `approver1_id` int(11) DEFAULT NULL,
  `approver1_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approver1_date` datetime DEFAULT NULL,
  `approver2_id` int(11) DEFAULT NULL,
  `approver2_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approver2_date` datetime DEFAULT NULL,
  `status` enum('pending','approved','rejected') GENERATED ALWAYS AS (case when `approver1_status` = 'approved' and `approver2_status` = 'approved' then 'approved' when `approver1_status` = 'rejected' or `approver2_status` = 'rejected' then 'rejected' else 'pending' end) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `permissions`
--

CREATE TABLE `permissions` (
  `id` int(11) NOT NULL,
  `permission_code` varchar(50) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `permissions`
--

INSERT INTO `permissions` (`id`, `permission_code`, `description`) VALUES
(1, 'login', 'allow user to log into the system'),
(2, 'logout', 'allow user to log out'),
(3, 'view_work_schedule', 'view personal work shifts'),
(4, 'clock_in_out', 'register attendance start/end'),
(5, 'view_history', 'view personal attendance history and hours'),
(6, 'request_leave', 'submit a request for leave/absence'),
(7, 'report_anomaly', 'report a system or attendance anomaly'),
(8, 'view_reports', 'view department or general reports'),
(9, 'approve_requests', 'approve or reject leave requests'),
(10, 'config_shifts', 'configure shifts and work hours'),
(11, 'monitor_attendance', 'monitor real-time employee attendance'),
(12, 'generate_reports', 'create and export company reports'),
(13, 'manage_employees', 'add or edit employee personal data'),
(14, 'resolve_anomalies', 'resolve reported anomalies'),
(15, 'create_accounts', 'create new user login credentials'),
(16, 'manage_accounts', 'edit or disable user accounts'),
(17, 'user_permissions_read', 'read user permissions'),
(18, 'user_permissions_create', 'create user permission overrides'),
(19, 'user_permissions_update', 'update user permission overrides'),
(20, 'user_permissions_delete', 'delete user permission overrides'),
(21, 'permissions_read_all', 'View all the permissions in the DB'),
(23, 'roles_permissions_update', 'Update roles permission overrides');

-- --------------------------------------------------------

--
-- Struttura della tabella `permission_exceptions`
--

CREATE TABLE `permission_exceptions` (
  `employee_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `is_allowed` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `permission_exceptions`
--

INSERT INTO `permission_exceptions` (`employee_id`, `permission_id`, `is_allowed`) VALUES
(23, 9, 1),
(23, 10, 1),
(23, 12, 0),
(23, 13, 0),
(23, 16, 1),
(23, 18, 1),
(23, 20, 0),
(24, 2, 0);

-- --------------------------------------------------------

--
-- Struttura della tabella `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` int(11) NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `user_id` int(11) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `refresh_tokens`
--

INSERT INTO `refresh_tokens` (`id`, `token_hash`, `user_id`, `expires_at`, `created_at`) VALUES
(1, 'fb75d3a26cc8646dad88b8faee46181e06729120e4848a76c3cfe64402d69395', 24, '2026-02-04 18:32:14', '2026-01-28 17:32:14'),
(2, 'd11a5ad443fcc385aba1e0c6be784dad2f2b450e2454438132bf9766a6a5a36e', 1, '2026-02-04 18:58:02', '2026-01-28 17:58:02'),
(3, 'eef11a8e2c2257d15b21bd74624778f626ea2f8b344de2a6dc82ee3a3c2cfdbf', 1, '2026-02-05 14:58:46', '2026-01-29 13:58:46'),
(4, 'a24bdedd31f7288b002426699a3cc06d3582bbf0ee097d61fe765cc38f1d9665', 1, '2026-02-05 15:01:04', '2026-01-29 14:01:04'),
(5, '0aa9c77d1844464be8914e847d9fcef8a3fff4d5a343cafd4f9eba3d56a7d32b', 1, '2026-02-05 15:02:44', '2026-01-29 14:02:44'),
(6, '310ef2b2a6822f72d82a5ecdb882a30505f22b837971761b910d76acc3cb0f40', 1, '2026-02-05 15:03:15', '2026-01-29 14:03:15'),
(7, '7635fe609637bcc6c7b41c6827856783bbcb4ac1681ec86c814003e6928ffbc2', 1, '2026-02-05 15:12:46', '2026-01-29 14:12:46'),
(8, '90dd18981de4c2208e92516fa9d04a054cdbaf274fed8202de8718aac2b7ced1', 1, '2026-02-05 15:18:03', '2026-01-29 14:18:03'),
(9, 'fddb4ad9b980cb96bb112c7afc2eb87935deb4d3ed2b75f957f9df1e6b90f32c', 1, '2026-02-05 15:26:20', '2026-01-29 14:26:20');

-- --------------------------------------------------------

--
-- Struttura della tabella `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `roles`
--

INSERT INTO `roles` (`id`, `role_name`) VALUES
(3, 'admin'),
(1, 'employee'),
(2, 'manager'),
(4, 'supervisor');

-- --------------------------------------------------------

--
-- Struttura della tabella `role_permission`
--

CREATE TABLE `role_permission` (
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `role_permission`
--

INSERT INTO `role_permission` (`role_id`, `permission_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(2, 1),
(2, 2),
(2, 3),
(2, 4),
(2, 5),
(2, 6),
(2, 7),
(2, 8),
(2, 9),
(2, 10),
(2, 11),
(3, 1),
(3, 2),
(3, 12),
(3, 13),
(3, 14),
(3, 15),
(3, 16),
(3, 17),
(3, 18),
(3, 19),
(3, 20),
(3, 21),
(3, 23),
(4, 1),
(4, 2),
(4, 3),
(4, 4),
(4, 5),
(4, 6),
(4, 7),
(4, 8),
(4, 9),
(4, 10),
(4, 11);

-- --------------------------------------------------------

--
-- Struttura della tabella `shifts`
--

CREATE TABLE `shifts` (
  `id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `shifts`
--

INSERT INTO `shifts` (`id`, `department_id`, `name`, `start_time`, `end_time`) VALUES
(1, 1, 'Mattina - Dept 1', '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(2, 2, 'Pomeriggio - Dept 2', '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(3, 3, 'Notte - Dept 3', '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(4, 4, 'Full Time - Dept 4', '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(5, 5, 'Supporto - Dept 5', '0000-00-00 00:00:00', '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Struttura della tabella `user_accounts`
--

CREATE TABLE `user_accounts` (
  `employee_id` int(11) NOT NULL,
  `email` varchar(254) NOT NULL,
  `password_hash` char(88) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `user_accounts`
--

INSERT INTO `user_accounts` (`employee_id`, `email`, `password_hash`, `created_at`, `updated_at`, `last_login`) VALUES
(1, 'gamba.daniele.studente@itispaleocapa.it', '+o7H25NqB5oBGQrCsa0r3w==6a805f8fde6a88988058f609c38ebe3442f508a01d1499aaa1a26e5ee8d2484f', '2026-01-06 17:58:12', '2026-01-06 17:58:12', NULL),
(23, 'lavelli.tommaso.studente@itispaleocapa.it', '3LKyFyCeqeODOlBALgD/Dg==1a4bf58a50f7aba81808ef2b91a71b7b62f0a1726d2ce636ea6e20630a88b099', '2026-01-23 09:27:26', '2026-01-23 12:34:12', '2026-01-23 12:34:12'),
(24, 'villa.davideousmane.studente@itispaleocapa.it', 'ZuQx7D7DRhldBvGm6YAAWw==d8c9eeb7bea5caed0a352ff3a43631423045d3db9fa593789ca8cb3824cdc188', '2026-01-23 09:27:58', '2026-01-28 17:32:14', '2026-01-28 17:32:14');

--
-- Indici per le tabelle scaricate
--

--
-- Indici per le tabelle `anomalies`
--
ALTER TABLE `anomalies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reporter_id` (`reporter_id`),
  ADD KEY `resolver_id` (`resolver_id`);

--
-- Indici per le tabelle `attendances`
--
ALTER TABLE `attendances`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `shift_id` (`shift_id`);

--
-- Indici per le tabelle `company_reports`
--
ALTER TABLE `company_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indici per le tabelle `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `department_name` (`department_name`);

--
-- Indici per le tabelle `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `role_id` (`role_id`),
  ADD KEY `department_id` (`department_id`);

--
-- Indici per le tabelle `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `approver1_id` (`approver1_id`),
  ADD KEY `approver2_id` (`approver2_id`);

--
-- Indici per le tabelle `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permission_code` (`permission_code`);

--
-- Indici per le tabelle `permission_exceptions`
--
ALTER TABLE `permission_exceptions`
  ADD PRIMARY KEY (`employee_id`,`permission_id`),
  ADD KEY `permission_id` (`permission_id`);

--
-- Indici per le tabelle `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `token_hash` (`token_hash`),
  ADD KEY `fk_user_refresh` (`user_id`);

--
-- Indici per le tabelle `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Indici per le tabelle `role_permission`
--
ALTER TABLE `role_permission`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `permission_id` (`permission_id`);

--
-- Indici per le tabelle `shifts`
--
ALTER TABLE `shifts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `department_id` (`department_id`);

--
-- Indici per le tabelle `user_accounts`
--
ALTER TABLE `user_accounts`
  ADD PRIMARY KEY (`employee_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT per le tabelle scaricate
--

--
-- AUTO_INCREMENT per la tabella `anomalies`
--
ALTER TABLE `anomalies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT per la tabella `attendances`
--
ALTER TABLE `attendances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT per la tabella `company_reports`
--
ALTER TABLE `company_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT per la tabella `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT per la tabella `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT per la tabella `leave_requests`
--
ALTER TABLE `leave_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT per la tabella `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT per la tabella `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT per la tabella `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT per la tabella `shifts`
--
ALTER TABLE `shifts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Limiti per le tabelle scaricate
--

--
-- Limiti per la tabella `anomalies`
--
ALTER TABLE `anomalies`
  ADD CONSTRAINT `anomalies_ibfk_1` FOREIGN KEY (`reporter_id`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `anomalies_ibfk_2` FOREIGN KEY (`resolver_id`) REFERENCES `employees` (`id`);

--
-- Limiti per la tabella `attendances`
--
ALTER TABLE `attendances`
  ADD CONSTRAINT `attendances_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `attendances_ibfk_2` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`);

--
-- Limiti per la tabella `company_reports`
--
ALTER TABLE `company_reports`
  ADD CONSTRAINT `company_reports_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`);

--
-- Limiti per la tabella `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  ADD CONSTRAINT `employees_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`);

--
-- Limiti per la tabella `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `leave_requests_ibfk_2` FOREIGN KEY (`approver1_id`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `leave_requests_ibfk_3` FOREIGN KEY (`approver2_id`) REFERENCES `employees` (`id`);

--
-- Limiti per la tabella `permission_exceptions`
--
ALTER TABLE `permission_exceptions`
  ADD CONSTRAINT `permission_exceptions_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `permission_exceptions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`);

--
-- Limiti per la tabella `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `fk_user_refresh` FOREIGN KEY (`user_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Limiti per la tabella `role_permission`
--
ALTER TABLE `role_permission`
  ADD CONSTRAINT `role_permission_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  ADD CONSTRAINT `role_permission_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`);

--
-- Limiti per la tabella `shifts`
--
ALTER TABLE `shifts`
  ADD CONSTRAINT `shifts_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`);

--
-- Limiti per la tabella `user_accounts`
--
ALTER TABLE `user_accounts`
  ADD CONSTRAINT `user_accounts_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

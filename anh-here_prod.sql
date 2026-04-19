-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Creato il: Apr 16, 2026 alle 20:10
-- Versione del server: 8.0.44
-- Versione PHP: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ANH-here_prod`
--

-- --------------------------------------------------------

--
-- Struttura della tabella `anomalies`
--

CREATE TABLE `anomalies` (
  `id` int NOT NULL,
  `tenant_id` int NOT NULL,
  `description` text COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `reporter_id` int NOT NULL,
  `employee_Id` int NOT NULL,
  `resolver_id` int DEFAULT NULL,
  `status` enum('open','in_progress','closed') COLLATE utf8mb4_general_ci DEFAULT 'open',
  `resolution_notes` text COLLATE utf8mb4_general_ci,
  `resolved_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `anomalies`
--

INSERT INTO `anomalies` (`id`, `tenant_id`, `description`, `created_at`, `reporter_id`, `employee_Id`, `resolver_id`, `status`, `resolution_notes`, `resolved_at`) VALUES
(1, 1, 'l\'impiegato invia troppo spesso richieste per l\'estensione della pausa pranzo', '2026-03-13 20:08:17', 1, 1, 1, 'closed', 'tutto ok, l\'impiegato si è scusato e ha promesso di non rifarlo più', '2026-03-13 20:15:40');

-- --------------------------------------------------------

--
-- Struttura della tabella `attendances`
--

CREATE TABLE `attendances` (
  `id` int NOT NULL,
  `tenant_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `shift_id` int NOT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `attendances`
--

INSERT INTO `attendances` (`id`, `tenant_id`, `employee_id`, `shift_id`, `start_datetime`, `end_datetime`) VALUES
(2, 1, 1, 1, '2026-01-28 08:00:00', '2026-01-28 14:00:00'),
(3, 1, 1, 1, '2026-01-29 07:58:00', '2026-03-13 19:31:32'),
(4, 1, 23, 2, '2026-01-28 14:00:00', '2026-01-28 20:05:00'),
(6, 1, 24, 4, '2026-01-28 09:00:00', '2026-01-28 18:00:00'),
(7, 1, 24, 4, '2026-01-29 08:50:00', '2026-01-29 17:55:00'),
(176, 1, 1, 1, '2026-04-04 13:39:09', '2026-04-10 08:37:50'),
(177, 1, 1, 1, '2026-04-10 08:37:52', '2026-04-10 08:38:01'),
(178, 1, 1, 1, '2026-04-10 08:38:03', '2026-04-10 08:42:03'),
(179, 1, 1, 1, '2026-04-10 08:42:05', '2026-04-10 09:21:07'),
(180, 1, 1, 1, '2026-04-10 12:43:10', '2026-04-10 12:43:11'),
(181, 1, 1, 1, '2026-04-10 12:43:12', '2026-04-10 12:43:12'),
(182, 1, 1, 1, '2026-04-10 12:43:12', '2026-04-10 12:43:12'),
(183, 1, 1, 1, '2026-04-10 12:43:13', '2026-04-10 12:43:13'),
(184, 1, 1, 1, '2026-04-10 12:43:13', '2026-04-10 12:43:13'),
(185, 1, 1, 1, '2026-04-10 12:43:13', '2026-04-10 12:43:14'),
(186, 1, 1, 1, '2026-04-10 12:43:14', '2026-04-10 12:49:42'),
(187, 1, 1, 1, '2026-04-10 13:33:29', '2026-04-13 08:55:26'),
(188, 1, 1, 1, '2026-04-13 08:55:29', '2026-04-13 08:55:43'),
(189, 1, 1, 1, '2026-04-16 19:26:32', NULL);

-- --------------------------------------------------------

--
-- Struttura della tabella `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL,
  `tenant_id` int NOT NULL,
  `action` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'CREATE, UPDATE, DELETE, LOGIN, LOGOUT',
  `resource` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'employees, departments, roles, accounts, etc.',
  `resource_id` int NOT NULL,
  `user_id` int NOT NULL,
  `changes` json DEFAULT NULL COMMENT 'JSON object: {field: {old: value, new: value}}',
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'IPv4 or IPv6 address',
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Browser/client info'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struttura stand-in per le viste `audit_logs_detailed`
-- (Vedi sotto per la vista effettiva)
--
CREATE TABLE `audit_logs_detailed` (
`id` bigint
,`tenant_id` int
,`action` varchar(20)
,`resource` varchar(100)
,`resource_id` int
,`timestamp` timestamp
,`user_name` varchar(101)
,`changes` json
,`ip_address` varchar(45)
);

-- --------------------------------------------------------

--
-- Struttura della tabella `company_reports`
--

CREATE TABLE `company_reports` (
  `id` int NOT NULL,
  `tenant_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `link` varchar(500) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `company_reports`
--

INSERT INTO `company_reports` (`id`, `tenant_id`, `employee_id`, `created_at`, `link`) VALUES
(1, 1, 1, '2026-04-10 13:08:35', 'https://youtu.be/dQw4w9WgXcQ?si=UO9JjbV2xy_XYrTo');

-- --------------------------------------------------------

--
-- Struttura della tabella `departments`
--

CREATE TABLE `departments` (
  `id` int NOT NULL,
  `tenant_id` int NOT NULL,
  `department_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `departments`
--

INSERT INTO `departments` (`id`, `tenant_id`, `department_name`) VALUES
(1, 1, 'administration'),
(2, 1, 'HR'),
(3, 1, 'IT'),
(4, 1, 'Logistics'),
(5, 1, 'Sales');

-- --------------------------------------------------------

--
-- Struttura della tabella `employees`
--

CREATE TABLE `employees` (
  `id` int NOT NULL,
  `tenant_id` int NOT NULL,
  `first_name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `last_name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `role_id` int NOT NULL,
  `department_id` int NOT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_general_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `employees`
--

INSERT INTO `employees` (`id`, `tenant_id`, `first_name`, `last_name`, `role_id`, `department_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'Daniele', 'Gamba', 3, 1, 'active', '2026-01-06 18:57:13', '2026-04-16 16:49:05'),
(23, 1, 'Tommaso', 'Lavelli', 2, 3, 'active', '2026-01-23 09:27:26', '2026-04-16 16:49:05'),
(24, 1, 'Davide', 'Villa', 1, 3, 'inactive', '2026-01-23 09:27:58', '2026-04-16 16:49:05');

-- --------------------------------------------------------

--
-- Struttura della tabella `global_users`
--

CREATE TABLE `global_users` (
  `id` bigint NOT NULL,
  `email` varchar(254) COLLATE utf8mb4_general_ci NOT NULL,
  `password_hash` char(88) COLLATE utf8mb4_general_ci NOT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `global_users`
--

INSERT INTO `global_users` (`id`, `email`, `password_hash`, `status`, `created_at`, `updated_at`, `last_login`) VALUES
(1, 'gamba.daniele.studente@itispaleocapa.it', '+o7H25NqB5oBGQrCsa0r3w==6a805f8fde6a88988058f609c38ebe3442f508a01d1499aaa1a26e5ee8d2484f', 'active', '2026-01-06 17:58:12', '2026-04-16 20:08:38', '2026-04-16 20:08:38'),
(2, 'lavelli.tommaso.studente@itispaleocapa.it', '3LKyFyCeqeODOlBALgD/Dg==1a4bf58a50f7aba81808ef2b91a71b7b62f0a1726d2ce636ea6e20630a88b099', 'active', '2026-01-23 09:27:26', '2026-04-16 16:49:05', '2026-04-10 06:33:56'),
(3, 'villa.davideousmane.studente@itispaleocapa.it', 'ZuQx7D7DRhldBvGm6YAAWw==d8c9eeb7bea5caed0a352ff3a43631423045d3db9fa593789ca8cb3824cdc188', 'active', '2026-01-23 09:27:58', '2026-04-16 16:49:05', '2026-01-28 17:32:14');

-- --------------------------------------------------------

--
-- Struttura della tabella `global_users_tenants`
--

CREATE TABLE `global_users_tenants` (
  `global_user_id` bigint NOT NULL,
  `tenant_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'active',
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `global_users_tenants`
--

INSERT INTO `global_users_tenants` (`global_user_id`, `tenant_id`, `employee_id`, `status`, `is_default`, `created_at`, `updated_at`, `last_login`) VALUES
(1, 1, 1, 'active', 1, '2026-01-06 17:58:12', '2026-04-16 20:08:38', '2026-04-16 20:08:38'),
(2, 1, 23, 'active', 1, '2026-01-23 09:27:26', '2026-04-16 18:23:37', '2026-04-10 06:33:56'),
(3, 1, 24, 'inactive', 1, '2026-01-23 09:27:58', '2026-04-16 18:23:37', '2026-01-28 17:32:14');

-- --------------------------------------------------------

--
-- Struttura della tabella `leave_requests`
--

CREATE TABLE `leave_requests` (
  `id` int NOT NULL,
  `tenant_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `request_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `type` enum('sick','vacation','personal','other') COLLATE utf8mb4_general_ci NOT NULL,
  `motivation` text COLLATE utf8mb4_general_ci,
  `approver1_id` int DEFAULT NULL,
  `approver1_status` enum('pending','approved','rejected') COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `approver1_date` datetime DEFAULT NULL,
  `approver2_id` int DEFAULT NULL,
  `approver2_status` enum('pending','approved','rejected') COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `approver2_date` datetime DEFAULT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_general_ci GENERATED ALWAYS AS ((case when ((`approver1_status` = _utf8mb4'approved') and (`approver2_status` = _utf8mb4'approved')) then _utf8mb4'approved' when ((`approver1_status` = _utf8mb4'rejected') or (`approver2_status` = _utf8mb4'rejected')) then _utf8mb4'rejected' else _utf8mb4'pending' end)) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `leave_requests`
--

INSERT INTO `leave_requests` (`id`, `tenant_id`, `employee_id`, `request_date`, `start_datetime`, `end_datetime`, `type`, `motivation`, `approver1_id`, `approver1_status`, `approver1_date`, `approver2_id`, `approver2_status`, `approver2_date`) VALUES
(1, 1, 1, '2026-03-13 19:42:25', '2026-03-14 12:00:00', '2026-03-14 13:30:00', 'other', 'dovevo andare a pranzo a mangiare un kebab', NULL, 'pending', NULL, NULL, 'pending', NULL);

-- --------------------------------------------------------

--
-- Struttura della tabella `permissions`
--

CREATE TABLE `permissions` (
  `id` int NOT NULL,
  `permission_code` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci
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
(23, 'roles_permissions_update', 'Update roles permission overrides'),
(24, 'delete_departments', 'delete departments'),
(25, 'delete_roles', 'delete roles'),
(26, 'delete_employees', 'delete employees'),
(27, 'delete_shifts', 'delete shifts'),
(28, 'delete_reports', 'delete company reports'),
(29, 'view_all_attendances', 'view attendance history and hours even for other users');

-- --------------------------------------------------------

--
-- Struttura della tabella `permission_exceptions`
--

CREATE TABLE `permission_exceptions` (
  `employee_id` int NOT NULL,
  `tenant_id` int NOT NULL,
  `permission_id` int NOT NULL,
  `is_allowed` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `permission_exceptions`
--

INSERT INTO `permission_exceptions` (`employee_id`, `tenant_id`, `permission_id`, `is_allowed`) VALUES
(23, 1, 9, 1),
(23, 1, 10, 1),
(23, 1, 12, 0),
(23, 1, 13, 0),
(23, 1, 16, 1),
(23, 1, 18, 1),
(23, 1, 20, 0),
(24, 1, 2, 0);

-- --------------------------------------------------------

--
-- Struttura della tabella `platform_refresh_tokens`
--

CREATE TABLE `platform_refresh_tokens` (
  `id` bigint NOT NULL,
  `platform_user_id` int NOT NULL,
  `token_hash` char(64) COLLATE utf8mb4_general_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `platform_users`
--

CREATE TABLE `platform_users` (
  `id` int NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_general_ci NOT NULL,
  `password_hash` char(88) COLLATE utf8mb4_general_ci NOT NULL,
  `first_name` varchar(80) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_name` varchar(80) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'active',
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `platform_users`
--

INSERT INTO `platform_users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `status`, `last_login`, `created_at`, `updated_at`) VALUES
(1, 'gamba.daniele.studente@itispaleocapa.it', '+o7H25NqB5oBGQrCsa0r3w==6a805f8fde6a88988058f609c38ebe3442f508a01d1499aaa1a26e5ee8d2484f', 'Daniele', 'Gamba', 'active', '2026-04-16 22:06:53', '2026-04-16 20:05:25', '2026-04-16 20:06:53');

-- --------------------------------------------------------

--
-- Struttura della tabella `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` int NOT NULL,
  `tenant_id` int NOT NULL,
  `global_user_id` bigint NOT NULL,
  `employee_id` int NOT NULL,
  `token_hash` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `refresh_tokens`
--

INSERT INTO `refresh_tokens` (`id`, `tenant_id`, `global_user_id`, `employee_id`, `token_hash`, `expires_at`, `created_at`) VALUES
(1, 1, 3, 24, 'fb75d3a26cc8646dad88b8faee46181e06729120e4848a76c3cfe64402d69395', '2026-02-04 18:32:14', '2026-01-28 17:32:14'),
(413, 1, 1, 1, '680f60e38baef213548a7ae96b5820f317492b38c589b88e239f51b26f2710c1', '2026-04-23 22:08:39', '2026-04-16 20:08:38');

-- --------------------------------------------------------

--
-- Struttura della tabella `roles`
--

CREATE TABLE `roles` (
  `id` int NOT NULL,
  `tenant_id` int NOT NULL,
  `role_name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `roles`
--

INSERT INTO `roles` (`id`, `tenant_id`, `role_name`) VALUES
(3, 1, 'admin'),
(1, 1, 'employee'),
(2, 1, 'manager'),
(4, 1, 'supervisor');

-- --------------------------------------------------------

--
-- Struttura della tabella `role_permission`
--

CREATE TABLE `role_permission` (
  `role_id` int NOT NULL,
  `tenant_id` int NOT NULL,
  `permission_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `role_permission`
--

INSERT INTO `role_permission` (`role_id`, `tenant_id`, `permission_id`) VALUES
(1, 1, 1),
(2, 1, 1),
(3, 1, 1),
(4, 1, 1),
(1, 1, 2),
(2, 1, 2),
(3, 1, 2),
(4, 1, 2),
(1, 1, 3),
(2, 1, 3),
(3, 1, 3),
(4, 1, 3),
(1, 1, 4),
(2, 1, 4),
(3, 1, 4),
(4, 1, 4),
(1, 1, 5),
(2, 1, 5),
(3, 1, 5),
(4, 1, 5),
(1, 1, 6),
(2, 1, 6),
(3, 1, 6),
(4, 1, 6),
(2, 1, 7),
(3, 1, 7),
(4, 1, 7),
(1, 1, 8),
(2, 1, 8),
(3, 1, 8),
(4, 1, 8),
(2, 1, 9),
(3, 1, 9),
(4, 1, 9),
(2, 1, 10),
(3, 1, 10),
(4, 1, 10),
(2, 1, 11),
(3, 1, 11),
(4, 1, 11),
(2, 1, 12),
(3, 1, 12),
(4, 1, 12),
(3, 1, 13),
(1, 1, 14),
(2, 1, 14),
(3, 1, 14),
(4, 1, 14),
(3, 1, 15),
(3, 1, 16),
(3, 1, 17),
(3, 1, 18),
(3, 1, 19),
(3, 1, 20),
(3, 1, 21),
(3, 1, 23),
(3, 1, 24),
(3, 1, 25),
(3, 1, 26),
(3, 1, 27),
(3, 1, 28),
(3, 1, 29);

-- --------------------------------------------------------

--
-- Struttura della tabella `shifts`
--

CREATE TABLE `shifts` (
  `id` int NOT NULL,
  `tenant_id` int NOT NULL,
  `department_id` int NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `shifts`
--

INSERT INTO `shifts` (`id`, `tenant_id`, `department_id`, `name`, `start_time`, `end_time`) VALUES
(1, 1, 1, 'Mattina', '2026-04-10 08:00:00', '2026-04-10 12:00:00'),
(2, 1, 2, 'Pomeriggio', '2026-04-10 12:00:00', '2026-04-10 14:00:00'),
(3, 1, 3, 'Notte', '2026-04-10 20:00:00', '2026-04-11 05:00:00'),
(4, 1, 4, 'Full Time', '2026-04-10 08:00:00', '2026-04-10 17:00:00'),
(5, 1, 5, 'Supporto', '2026-04-10 14:00:00', '2026-04-10 16:00:00');

-- --------------------------------------------------------

--
-- Struttura della tabella `tenants`
--

CREATE TABLE `tenants` (
  `id` int NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_general_ci NOT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `tenants`
--

INSERT INTO `tenants` (`id`, `name`, `status`, `created_at`, `updated_at`) VALUES
(1, 'ANH-here srl', 'active', '2026-04-16 16:49:05', '2026-04-16 16:49:05'),
(2, 'ACME spa', 'active', '2026-04-16 17:44:58', '2026-04-16 18:00:36');

--
-- Indici per le tabelle scaricate
--

--
-- Indici per le tabelle `anomalies`
--
ALTER TABLE `anomalies`
  ADD PRIMARY KEY (`tenant_id`,`id`),
  ADD UNIQUE KEY `uk_anomalies_id_global` (`id`),
  ADD KEY `reporter_id` (`reporter_id`),
  ADD KEY `resolver_id` (`resolver_id`),
  ADD KEY `idx_anomalies_tenant_reporter` (`tenant_id`,`reporter_id`),
  ADD KEY `idx_anomalies_tenant_resolver` (`tenant_id`,`resolver_id`),
  ADD KEY `idx_anomalies_tenant_employee` (`tenant_id`,`employee_Id`),
  ADD KEY `fk_anomalies_reporter_tenant` (`reporter_id`,`tenant_id`),
  ADD KEY `fk_anomalies_resolver_tenant` (`resolver_id`,`tenant_id`),
  ADD KEY `fk_anomalies_employee_tenant` (`employee_Id`,`tenant_id`),
  ADD KEY `idx_anomalies_tenant_reporter2` (`tenant_id`,`reporter_id`),
  ADD KEY `idx_anomalies_tenant_resolver2` (`tenant_id`,`resolver_id`),
  ADD KEY `idx_anomalies_tenant_employee2` (`tenant_id`,`employee_Id`);

--
-- Indici per le tabelle `attendances`
--
ALTER TABLE `attendances`
  ADD PRIMARY KEY (`tenant_id`,`id`),
  ADD UNIQUE KEY `uk_attendances_id_global` (`id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `shift_id` (`shift_id`),
  ADD KEY `idx_open_attendance` (`employee_id`,`end_datetime`),
  ADD KEY `idx_attendances_tenant_employee` (`tenant_id`,`employee_id`),
  ADD KEY `idx_attendances_tenant_shift` (`tenant_id`,`shift_id`),
  ADD KEY `fk_attendances_employee_tenant` (`employee_id`,`tenant_id`),
  ADD KEY `fk_attendances_shift_tenant` (`shift_id`,`tenant_id`),
  ADD KEY `idx_attendances_tenant_employee2` (`tenant_id`,`employee_id`),
  ADD KEY `idx_attendances_tenant_shift2` (`tenant_id`,`shift_id`);

--
-- Indici per le tabelle `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`tenant_id`,`id`),
  ADD UNIQUE KEY `uk_audit_logs_id_global` (`id`),
  ADD KEY `idx_timestamp` (`timestamp`),
  ADD KEY `idx_user_action` (`user_id`,`action`),
  ADD KEY `idx_resource` (`resource`,`resource_id`),
  ADD KEY `idx_resource_id` (`resource_id`),
  ADD KEY `idx_audit_logs_tenant` (`tenant_id`),
  ADD KEY `idx_audit_logs_tenant_timestamp` (`tenant_id`,`timestamp`);

--
-- Indici per le tabelle `company_reports`
--
ALTER TABLE `company_reports`
  ADD PRIMARY KEY (`tenant_id`,`id`),
  ADD UNIQUE KEY `uk_company_reports_id_global` (`id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `idx_company_reports_tenant_employee` (`tenant_id`,`employee_id`),
  ADD KEY `fk_company_reports_employee_tenant` (`employee_id`,`tenant_id`),
  ADD KEY `idx_company_reports_tenant_employee2` (`tenant_id`,`employee_id`);

--
-- Indici per le tabelle `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`tenant_id`,`id`),
  ADD UNIQUE KEY `uk_departments_id_tenant` (`id`,`tenant_id`),
  ADD UNIQUE KEY `uk_departments_tenant_name` (`tenant_id`,`department_name`),
  ADD UNIQUE KEY `uk_departments_id_global` (`id`),
  ADD KEY `idx_departments_tenant` (`tenant_id`);

--
-- Indici per le tabelle `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`tenant_id`,`id`),
  ADD UNIQUE KEY `uk_employees_id_tenant` (`id`,`tenant_id`),
  ADD UNIQUE KEY `uk_employees_id_global` (`id`),
  ADD KEY `role_id` (`role_id`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `idx_employees_tenant` (`tenant_id`),
  ADD KEY `idx_employees_tenant_role` (`tenant_id`,`role_id`),
  ADD KEY `idx_employees_tenant_department` (`tenant_id`,`department_id`),
  ADD KEY `fk_employees_role_tenant` (`role_id`,`tenant_id`),
  ADD KEY `fk_employees_department_tenant` (`department_id`,`tenant_id`),
  ADD KEY `idx_employees_tenant_role2` (`tenant_id`,`role_id`),
  ADD KEY `idx_employees_tenant_department2` (`tenant_id`,`department_id`);

--
-- Indici per le tabelle `global_users`
--
ALTER TABLE `global_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_global_users_email` (`email`);

--
-- Indici per le tabelle `global_users_tenants`
--
ALTER TABLE `global_users_tenants`
  ADD PRIMARY KEY (`global_user_id`,`tenant_id`),
  ADD UNIQUE KEY `uk_gut_tenant_employee` (`tenant_id`,`employee_id`),
  ADD KEY `idx_gut_tenant` (`tenant_id`),
  ADD KEY `idx_gut_employee` (`employee_id`),
  ADD KEY `idx_gut_default` (`global_user_id`,`is_default`);

--
-- Indici per le tabelle `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD PRIMARY KEY (`tenant_id`,`id`),
  ADD UNIQUE KEY `uk_leave_requests_id_global` (`id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `approver1_id` (`approver1_id`),
  ADD KEY `approver2_id` (`approver2_id`),
  ADD KEY `idx_leave_requests_tenant_employee` (`tenant_id`,`employee_id`),
  ADD KEY `idx_leave_requests_tenant_approver1` (`tenant_id`,`approver1_id`),
  ADD KEY `idx_leave_requests_tenant_approver2` (`tenant_id`,`approver2_id`),
  ADD KEY `fk_leave_requests_employee_tenant` (`employee_id`,`tenant_id`),
  ADD KEY `fk_leave_requests_approver1_tenant` (`approver1_id`,`tenant_id`),
  ADD KEY `fk_leave_requests_approver2_tenant` (`approver2_id`,`tenant_id`),
  ADD KEY `idx_leave_requests_tenant_employee2` (`tenant_id`,`employee_id`),
  ADD KEY `idx_leave_requests_tenant_approver12` (`tenant_id`,`approver1_id`),
  ADD KEY `idx_leave_requests_tenant_approver22` (`tenant_id`,`approver2_id`);

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
  ADD PRIMARY KEY (`tenant_id`,`employee_id`,`permission_id`),
  ADD KEY `permission_id` (`permission_id`),
  ADD KEY `idx_permission_exceptions_permission` (`permission_id`),
  ADD KEY `fk_permission_exceptions_employee_tenant` (`employee_id`,`tenant_id`);

--
-- Indici per le tabelle `platform_refresh_tokens`
--
ALTER TABLE `platform_refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_platform_refresh_token_hash` (`token_hash`),
  ADD KEY `idx_platform_refresh_user` (`platform_user_id`),
  ADD KEY `idx_platform_refresh_expires_at` (`expires_at`);

--
-- Indici per le tabelle `platform_users`
--
ALTER TABLE `platform_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_platform_users_email` (`email`),
  ADD KEY `idx_platform_users_status` (`status`);

--
-- Indici per le tabelle `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`tenant_id`,`id`),
  ADD UNIQUE KEY `uk_refresh_tokens_id_global` (`id`),
  ADD KEY `token_hash` (`token_hash`),
  ADD KEY `idx_refresh_tokens_tenant_user` (`tenant_id`),
  ADD KEY `idx_refresh_tokens_tenant_hash` (`tenant_id`,`token_hash`),
  ADD KEY `idx_refresh_tokens_tenant_user2` (`tenant_id`),
  ADD KEY `idx_refresh_tokens_global_tenant` (`global_user_id`,`tenant_id`),
  ADD KEY `idx_refresh_tokens_tenant_employee` (`tenant_id`,`employee_id`);

--
-- Indici per le tabelle `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`tenant_id`,`id`),
  ADD UNIQUE KEY `uk_roles_id_tenant` (`id`,`tenant_id`),
  ADD UNIQUE KEY `uk_roles_tenant_name` (`tenant_id`,`role_name`),
  ADD UNIQUE KEY `uk_roles_id_global` (`id`),
  ADD KEY `idx_roles_tenant` (`tenant_id`);

--
-- Indici per le tabelle `role_permission`
--
ALTER TABLE `role_permission`
  ADD PRIMARY KEY (`tenant_id`,`role_id`,`permission_id`),
  ADD KEY `permission_id` (`permission_id`),
  ADD KEY `idx_role_permission_permission` (`permission_id`),
  ADD KEY `fk_role_permission_role_tenant` (`role_id`,`tenant_id`);

--
-- Indici per le tabelle `shifts`
--
ALTER TABLE `shifts`
  ADD PRIMARY KEY (`tenant_id`,`id`),
  ADD UNIQUE KEY `uk_shifts_id_tenant` (`id`,`tenant_id`),
  ADD UNIQUE KEY `uk_shifts_id_global` (`id`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `idx_shifts_tenant` (`tenant_id`),
  ADD KEY `idx_shifts_tenant_department` (`tenant_id`,`department_id`),
  ADD KEY `fk_shifts_department_tenant` (`department_id`,`tenant_id`),
  ADD KEY `idx_shifts_tenant_department2` (`tenant_id`,`department_id`);

--
-- Indici per le tabelle `tenants`
--
ALTER TABLE `tenants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_tenants_name` (`name`);

--
-- AUTO_INCREMENT per le tabelle scaricate
--

--
-- AUTO_INCREMENT per la tabella `anomalies`
--
ALTER TABLE `anomalies`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT per la tabella `attendances`
--
ALTER TABLE `attendances`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=190;

--
-- AUTO_INCREMENT per la tabella `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT per la tabella `company_reports`
--
ALTER TABLE `company_reports`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT per la tabella `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT per la tabella `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT per la tabella `global_users`
--
ALTER TABLE `global_users`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT per la tabella `leave_requests`
--
ALTER TABLE `leave_requests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT per la tabella `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT per la tabella `platform_refresh_tokens`
--
ALTER TABLE `platform_refresh_tokens`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT per la tabella `platform_users`
--
ALTER TABLE `platform_users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT per la tabella `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=414;

--
-- AUTO_INCREMENT per la tabella `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT per la tabella `shifts`
--
ALTER TABLE `shifts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT per la tabella `tenants`
--
ALTER TABLE `tenants`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

-- --------------------------------------------------------

--
-- Struttura per vista `audit_logs_detailed`
--
DROP TABLE IF EXISTS `audit_logs_detailed`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `audit_logs_detailed`  AS SELECT `a`.`id` AS `id`, `a`.`tenant_id` AS `tenant_id`, `a`.`action` AS `action`, `a`.`resource` AS `resource`, `a`.`resource_id` AS `resource_id`, `a`.`timestamp` AS `timestamp`, coalesce(concat(`e`.`first_name`,' ',`e`.`last_name`),'System') AS `user_name`, `a`.`changes` AS `changes`, `a`.`ip_address` AS `ip_address` FROM (`audit_logs` `a` left join `employees` `e` on(((`e`.`id` = `a`.`user_id`) and (`e`.`tenant_id` = `a`.`tenant_id`)))) ORDER BY `a`.`timestamp` DESC ;

--
-- Limiti per le tabelle scaricate
--

--
-- Limiti per la tabella `anomalies`
--
ALTER TABLE `anomalies`
  ADD CONSTRAINT `fk_anomalies_employee_tenant_v2` FOREIGN KEY (`tenant_id`,`employee_Id`) REFERENCES `employees` (`tenant_id`, `id`),
  ADD CONSTRAINT `fk_anomalies_reporter_tenant_v2` FOREIGN KEY (`tenant_id`,`reporter_id`) REFERENCES `employees` (`tenant_id`, `id`),
  ADD CONSTRAINT `fk_anomalies_resolver_tenant_v2` FOREIGN KEY (`tenant_id`,`resolver_id`) REFERENCES `employees` (`tenant_id`, `id`),
  ADD CONSTRAINT `fk_anomalies_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`);

--
-- Limiti per la tabella `attendances`
--
ALTER TABLE `attendances`
  ADD CONSTRAINT `fk_attendances_employee_tenant_v2` FOREIGN KEY (`tenant_id`,`employee_id`) REFERENCES `employees` (`tenant_id`, `id`),
  ADD CONSTRAINT `fk_attendances_shift_tenant_v2` FOREIGN KEY (`tenant_id`,`shift_id`) REFERENCES `shifts` (`tenant_id`, `id`),
  ADD CONSTRAINT `fk_attendances_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`);

--
-- Limiti per la tabella `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `fk_audit_logs_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`);

--
-- Limiti per la tabella `company_reports`
--
ALTER TABLE `company_reports`
  ADD CONSTRAINT `fk_company_reports_employee_tenant_v2` FOREIGN KEY (`tenant_id`,`employee_id`) REFERENCES `employees` (`tenant_id`, `id`),
  ADD CONSTRAINT `fk_company_reports_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`);

--
-- Limiti per la tabella `departments`
--
ALTER TABLE `departments`
  ADD CONSTRAINT `fk_departments_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`);

--
-- Limiti per la tabella `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `fk_employees_department_tenant_v2` FOREIGN KEY (`tenant_id`,`department_id`) REFERENCES `departments` (`tenant_id`, `id`),
  ADD CONSTRAINT `fk_employees_role_tenant_v2` FOREIGN KEY (`tenant_id`,`role_id`) REFERENCES `roles` (`tenant_id`, `id`),
  ADD CONSTRAINT `fk_employees_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`);

--
-- Limiti per la tabella `global_users_tenants`
--
ALTER TABLE `global_users_tenants`
  ADD CONSTRAINT `fk_gut_employee` FOREIGN KEY (`tenant_id`,`employee_id`) REFERENCES `employees` (`tenant_id`, `id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_gut_global_user` FOREIGN KEY (`global_user_id`) REFERENCES `global_users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_gut_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Limiti per la tabella `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD CONSTRAINT `fk_leave_requests_approver1_tenant_v2` FOREIGN KEY (`tenant_id`,`approver1_id`) REFERENCES `employees` (`tenant_id`, `id`),
  ADD CONSTRAINT `fk_leave_requests_approver2_tenant_v2` FOREIGN KEY (`tenant_id`,`approver2_id`) REFERENCES `employees` (`tenant_id`, `id`),
  ADD CONSTRAINT `fk_leave_requests_employee_tenant_v2` FOREIGN KEY (`tenant_id`,`employee_id`) REFERENCES `employees` (`tenant_id`, `id`),
  ADD CONSTRAINT `fk_leave_requests_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`);

--
-- Limiti per la tabella `permission_exceptions`
--
ALTER TABLE `permission_exceptions`
  ADD CONSTRAINT `fk_permission_exceptions_employee_tenant_v2` FOREIGN KEY (`tenant_id`,`employee_id`) REFERENCES `employees` (`tenant_id`, `id`),
  ADD CONSTRAINT `fk_permission_exceptions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`),
  ADD CONSTRAINT `fk_permission_exceptions_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`);

--
-- Limiti per la tabella `platform_refresh_tokens`
--
ALTER TABLE `platform_refresh_tokens`
  ADD CONSTRAINT `fk_platform_refresh_user` FOREIGN KEY (`platform_user_id`) REFERENCES `platform_users` (`id`) ON DELETE CASCADE;

--
-- Limiti per la tabella `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `fk_refresh_tokens_global_tenant` FOREIGN KEY (`global_user_id`,`tenant_id`) REFERENCES `global_users_tenants` (`global_user_id`, `tenant_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_refresh_tokens_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  ADD CONSTRAINT `fk_refresh_tokens_tenant_employee` FOREIGN KEY (`tenant_id`,`employee_id`) REFERENCES `global_users_tenants` (`tenant_id`, `employee_id`) ON DELETE CASCADE;

--
-- Limiti per la tabella `roles`
--
ALTER TABLE `roles`
  ADD CONSTRAINT `fk_roles_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`);

--
-- Limiti per la tabella `role_permission`
--
ALTER TABLE `role_permission`
  ADD CONSTRAINT `fk_role_permission_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`),
  ADD CONSTRAINT `fk_role_permission_role_tenant_v2` FOREIGN KEY (`tenant_id`,`role_id`) REFERENCES `roles` (`tenant_id`, `id`),
  ADD CONSTRAINT `fk_role_permission_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`);

--
-- Limiti per la tabella `shifts`
--
ALTER TABLE `shifts`
  ADD CONSTRAINT `fk_shifts_department_tenant_v2` FOREIGN KEY (`tenant_id`,`department_id`) REFERENCES `departments` (`tenant_id`, `id`),
  ADD CONSTRAINT `fk_shifts_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

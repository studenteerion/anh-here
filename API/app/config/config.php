<?php

define('DB_HOST', 'localhost');
define('DB_NAME', 'ANH-here_prod');
define('DB_USER', 'root');
define('DB_PASS', '');
// Metti il nome del tuo DB qui

// Root dell'applicazione (per includere file)
define('APPROOT', dirname(dirname(__FILE__)));

// Root dell'URL (per i link nel browser - cambia se serve)
define('URLROOT', 'http://localhost/API');

// Nome del Sito
define('SITENAME', 'API');

//Chiave segreta del jwt
define('JWT_KEY', 'S3cr3t_K3y_ANH_H3r3_Pr0d_2024_S3cur3_P@ss');

//Pepper per l'hasing
define('PEPPER', 'S3cr3tP3pp3rV@lu3');
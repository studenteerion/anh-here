<?php
// 1. Diciamo che il contenuto è JSON
header('Content-Type: application/json; charset=utf-8');

// 2. Impostiamo il codice di risposta (200 = OK)
http_response_code($data["status_code"]);

// 3. Mostriamo il JSON a video
echo json_encode($data);
exit; // È buona pratica terminare lo script subito dopo

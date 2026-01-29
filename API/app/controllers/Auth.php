<?php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class Auth extends Controller
{
    private $userModel;
    private $refreshTokenModel;

    public function __construct()
    {
        // Connessione e caricamento modelli
        $db = new Database();
        $this->userModel = $this->model("Users", $db);
        $this->refreshTokenModel = $this->model("RefreshToken", $db);
    }

    // --- LOGIN ---
    public function login()
    {
        // 1. Prendiamo i dati dal body JSON
        $input = json_decode(file_get_contents("php://input"));

        if (empty($input->email) || empty($input->password)) {
            $this->rispondiJson("Dati mancanti", 400);
            return;
        }

        // 2. Cerchiamo l'utente
        $user = $this->userModel->getUserByEmail($input->email);

        // 3. Verifichiamo la password (uso la tua funzione custom checkPassword)
        if (!$user || !$this->checkPassword($input->password, $user->password_hash)) {
            $this->rispondiJson("Credenziali errate", 401);
            return;
        }

        // --- SEI LOGGATO, ORA GENERIAMO I TOKEN ---

        // A. ACCESS TOKEN (JWT) - Dura poco (es. 10 min)
        // Lo creiamo direttamente qui per semplicità
        // 1. Genera ACCESS TOKEN (breve durata)
        $jwtPayload = [
            'iss' => 'AlpineNode',
            'iat' => time(),
            'exp' => time() + 600,
            'sub' => $user->employee_id,
            'data' => ['role_id' => $user->role_id]
        ];
        $accessToken = JWT::encode($jwtPayload, JWT_KEY, 'HS256');

        // 2. Genera REFRESH TOKEN (lunga durata)
        $refreshToken = bin2hex(random_bytes(32));

        // 3. Salva l'HASH nel DB (Sicurezza)
        $this->refreshTokenModel->storeToken([
            "user_id" => $user->employee_id,
            "refresh_token" => hash('sha256', $refreshToken)
        ]);

        // 4. RISPOSTA JSON PULITA
        // Restituiamo entrambi i token. Sarà il TUO SITO a decidere come salvarli.
        $this->view("data", [
            "status" => "success",
            "status_code" => 200,
            "token" => $accessToken,          // Access Token
            "refresh_token" => $refreshToken,
            "role" => $user->role_id, // Refresh Token (Ora lo passiamo!)
            "expires_in" => 600
        ]);
    }

    // --- REFRESH ---
    public function refresh()
    {
        // 1. Controlliamo se il browser ci ha mandato il cookie
        if (!isset($_COOKIE['refresh_token'])) {
            $this->rispondiJson("Nessun token fornito", 401);
            return;
        }

        $tokenRicevuto = $_COOKIE['refresh_token'];

        // 2. Cerchiamo nel DB l'hash di questo token
        $hashDaCercare = hash('sha256', $tokenRicevuto);
        $tokenNelDb = $this->refreshTokenModel->findTokenByHash($hashDaCercare);

        // 3. Se non esiste o è scaduto
        if (!$tokenNelDb) {
            // Cancelliamo il cookie dal browser per pulizia
            setcookie('refresh_token', '', ['expires' => time() - 3600, 'path' => '/api/auth/refresh']);
            $this->rispondiJson("Token non valido", 401);
            return;
        }

        // 4. Tutto ok! Generiamo un nuovo Access Token
        $user = $this->userModel->getUserById($tokenNelDb->user_id);

        $nuovoPayload = [
            'iss' => 'AlpineNode',
            'iat' => time(),
            'exp' => time() + 600,
            'sub' => $user->employee_id,
            'data' => [
                'role_id' => $user->role_id,
                'name' => $user->first_name
            ]
        ];
        $nuovoAccessToken = JWT::encode($nuovoPayload, JWT_KEY, 'HS256');

        // 5. Inviamo il nuovo token
        $this->view("data", [
            "status" => "success",
            "status_code" => 200,
            "token" => $nuovoAccessToken,
            "role" => $user->role_id,
            "expires_in" => 600
        ]);
    }

    public function validate()
    {
        $headers = apache_request_headers();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $this->rispondiJson("Token mancante o malformato", 401);
            return null;
        }

        $token = $matches[1];

        if (empty($token)) {
            $this->rispondiJson("Dati mancanti", 400);
            return;
        }

        try {
            $decoded = JWT::decode($token, new Key(JWT_KEY, 'HS256'));
            $this->view("data", [
                "status" => "success",
                "status_code" => 200,
                "message" => "Token valido",
                "data" => $decoded
            ]);
        } catch (Exception $e) {
            $this->rispondiJson("Token non valido: ", 401);
        }
    }

    // --- Helper semplice per rispondere JSON ---
    private function rispondiJson($messaggio, $code)
    {
        $data = [
            "status" => "error",
            "status_code" => $code,
            "message" => $messaggio
        ];
        $this->view("data", $data);
    }

    // --- Tua verifica password ---
    private function checkPassword($password, $storedHash)
    {
        $salt = substr($storedHash, 0, 24);
        $hashedPassword = hash('sha256', $salt . $password . PEPPER);
        return $storedHash === $salt . $hashedPassword;
    }
}
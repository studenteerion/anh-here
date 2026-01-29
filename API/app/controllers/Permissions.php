<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;

class Permissions extends Controller
{
    private $db_conn;
    private $permissionModel;

    public function __construct()
    {
        $this->db_conn = new Database();
        try {
            $this->permissionModel = $this->model("PermissionsModel", $this->db_conn);
        } catch (Exception $e) {
            die("Errore: impossibile trovare il Permissions model");
        }
    }

    // =========================================================================
    // FUNZIONI PUBBLICHE (ENDPOINT)
    // =========================================================================

    public function index($id = null)//visualizza i miei permessi o quelli di un altro utente se inserisco un id e ho i permessi
    {
        // 1. Verifica il token (se fallisce, checkAuth invia l'errore e ritorna null)
        $decoded = $this->checkAuth();
        if (!$decoded)
            return;

        $userId = $decoded->sub;
        $roleId = $decoded->data->role_id;
        $targetUserId = $userId; // Di base cerco i miei permessi

        // 2. Se viene chiesto un ID diverso dal mio
        if ($id !== null && $id != $userId) {

            // Verifico se HO il permesso di leggere gli altri
            $myPermissions = $this->permissionModel->getUserPermissionsById($userId);

            if (!$this->hasPermission($myPermissions, 'user_permissions_read')) {
                $this->sendResponse("error", 403, "Permessi insufficienti per visualizzare le autorizzazioni altrui");
                return;
            }
            $targetUserId = $id;
        }

        // 3. Recupero i permessi e invio risposta
        $permissionsList = $this->permissionModel->getUserPermissionsById($targetUserId);

        $this->sendResponse("success", 200, null, [
            "user_id" => $userId,
            "role_id" => $roleId,
            "permissions" => $permissionsList
        ]);
    }

    public function all()//visualizza tutti i permessi esistenti nel sistema
    {
        // 1. Verifica Token
        $decoded = $this->checkAuth();
        if (!$decoded)
            return;

        $userId = $decoded->sub;

        // 2. Verifica permesso Admin
        $myPermissions = $this->permissionModel->getUserPermissionsById($userId);

        if (!$this->hasPermission($myPermissions, 'permissions_read_all')) {
            $this->sendResponse("error", 403, "Permessi insufficienti per accedere a tutte le autorizzazioni");
            return;
        }

        // 3. Recupero tutti i permessi esistenti
        $allPermissions = $this->permissionModel->getAllPermissions();

        $this->sendResponse("success", 200, null, [
            "permissions" => $allPermissions
        ]);
    }

    public function change()//modifica i permessi di un utente
    {
        // 1. Verifica Token
        $decoded = $this->checkAuth();
        if (!$decoded)
            return;

        // 2. Lettura dati in ingresso
        $input = json_decode(file_get_contents("php://input"));
        $targetUserId = $input->userId ?? null;
        $permissionId = $input->permissionId ?? null;
        $isAllowed = $input->isAllowed ?? 0;

        // Controllo validità dati
        if (!$targetUserId || !$permissionId) {
            $this->sendResponse("error", 400, "Dati mancanti (userId o permissionId)");
            return;
        }

        $myUserId = $decoded->sub;

        // 3. Controllo: non puoi modificare te stesso
        if ($myUserId == $targetUserId) {
            $this->sendResponse("error", 403, "Non puoi modificare i permessi a te stesso");
            return;
        }

        // 4. Controllo permessi Admin
        $myPermissions = $this->permissionModel->getUserPermissionsById($myUserId);

        if (!$this->hasPermission($myPermissions, 'user_permissions_update')) {
            $this->sendResponse("error", 403, "Permessi insufficienti per modificare le autorizzazioni altrui");
            return;
        }

        // 5. Verifica se l'utente bersaglio HA quel permesso (come da tua logica originale)
        $targetPermissions = $this->permissionModel->getUserPermissionsById($targetUserId);

        // Uso una funzione per cercare l'ID del permesso invece del codice
        $permessoTrovato = false;
        foreach ($targetPermissions as $perm) {
            if ($perm->id == $permissionId) {
                $permessoTrovato = true;
                break;
            }
        }

        if (!$permessoTrovato && $isAllowed == 0) {
            $this->sendResponse("error", 422, "L'utente non possiede questo permesso");
            return;
        }

        // 6. Esecuzione modifica
        $this->permissionModel->addPermissionToUser($targetUserId, $permissionId, $isAllowed);

        $this->sendResponse("success", 200, "Permesso modificato con successo");
    }

    public function createPermission()
    { //crea un nuovo permesso nel sistema
        // 1. Verifica Token
        $decoded = $this->checkAuth();
        if (!$decoded)
            return;

        // 2. Lettura dati in ingresso
        $input = json_decode(file_get_contents("php://input"));
        $permissionCode = $input->permissionCode ?? null;
        $description = $input->description ?? null;

        // Controllo validità dati
        if (!$permissionCode || !$description) {
            $this->sendResponse("error", 400, "Dati mancanti (permissionCode o description)");
            return;
        }

        $myUserId = $decoded->sub;

        $myPermissions = $this->permissionModel->getUserPermissionsById($myUserId);

        if (!$this->hasPermission($myPermissions, 'user_permissions_create')) {
            $this->sendResponse("error", 403, "Permessi insufficienti per creare le autorizzazioni");
            return;
        }


        $result = $this->permissionModel->createPermission($permissionCode, $description);

        if (!$result) {
            $this->sendResponse("error", 409, "Errore durante la creazione del permesso");
            return;
        }

        $this->sendResponse("success", 201, "Permesso creato con successo");
    }


    public function updateRolePermission()
    { //modifica i permessi associati a un ruolo

        // 1. Verifica Token
        $decoded = $this->checkAuth();
        if (!$decoded)
            return;

        // 2. Lettura dati in ingresso
        $input = json_decode(file_get_contents("php://input"));
        $roleId = $input->roleId ?? null;
        $permissionId = $input->permissionId ?? null;
        $allowed = $input->isAllowed ?? 1;

        // Controllo validità dati
        if (!$permissionId || !$roleId) {
            $this->sendResponse("error", 400, "Dati mancanti (permissionId o roleId)");
            return;
        }

        $myUserId = $decoded->sub;

        $myPermissions = $this->permissionModel->getUserPermissionsById($myUserId);

        if (!$this->hasPermission($myPermissions, 'roles_permissions_update')) {
            $this->sendResponse("error", 403, "Permessi insufficienti per modificare le autorizzazioni dei ruoli");
            return;
        }


        $result = $this->permissionModel->editRolePermission($roleId, $permissionId, $allowed);


        if (!$result) {
            $this->sendResponse("error", 409, "Errore durante la modifica del permesso al ruolo del permesso al ruolo");
            return;
        }

        $this->sendResponse("success", 200, "Permesso modificato al ruolo con successo");

    }

    // =========================================================================
    // FUNZIONI PRIVATE (HELPER - NON TOCCARE)
    // =========================================================================

    /**
     * Gestisce tutta la parte noiosa del JWT.
     * Restituisce i dati decodificati se tutto ok, altrimenti NULL.
     */
    private function checkAuth()
    {
        $headers = apache_request_headers();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $this->sendResponse("error", 401, "Token mancante o malformato");
            return null;
        }

        $token = $matches[1];

        try {
            // Decodifica il token
            return JWT::decode($token, new Key(JWT_KEY, 'HS256'));

        } catch (ExpiredException $e) {
            $this->sendResponse("error", 401, "Token scaduto (Expired)", ["error_code" => "TOKEN_EXPIRED"]);
            return null;
        } catch (SignatureInvalidException $e) {
            $this->sendResponse("error", 401, "Token non valido o manomesso", ["error_code" => "TOKEN_INVALID"]);
            return null;
        } catch (Exception $e) {
            $this->sendResponse("error", 401, "Errore di autenticazione generico: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Controlla se nella lista dei permessi c'è quel codice specifico.
     * Sostituisce i cicli foreach ripetuti.
     */
    private function hasPermission($listaPermessi, $codiceDaCercare)
    {
        foreach ($listaPermessi as $perm) {
            if ($perm->permission_code === $codiceDaCercare) {
                return true;
            }
        }
        return false;
    }

    /**
     * Standardizza l'invio delle risposte JSON al frontend.
     */
    private function sendResponse($status, $code, $message = null, $extraData = [])
    {
        $data = [
            "status" => $status,
            "status_code" => $code
        ];

        if ($message) {
            $data["message"] = $message;
        }

        // Se ci sono dati extra (es. error_code o la lista permissions), li unisco
        if (!empty($extraData)) {
            $data = array_merge($data, $extraData);
        }

        $this->view("data", $data);
    }
}
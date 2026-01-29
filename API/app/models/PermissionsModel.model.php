<?php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class PermissionsModel
{
    private $db;

    public function __construct($db_conn)
    {
        $this->db = $db_conn;
    }

    public function insertNewPermission($permissionCode, $description) //Inserisci un permesso in generale non a qualcuno di specifico
    {
        $query = "INSERT INTO permissions (permission_code, description) 
                  VALUES (:permission_code, :description)";

        $this->db->query($query);

        $this->db->bind(":permission_code", $permissionCode);
        $this->db->bind(":description", $description);

        $result = $this->db->execute();

        return $result;
    }

    public function editRolePermission($roleId, $permissionId, $allowed)
    {

        $query = "INSERT INTO role_permission (role_id, permission_id) 
                  VALUES (:role_id, :permission_id)";


        if (!$allowed) {
            $query = "DELETE FROM role_permission 
                      WHERE role_id = :role_id AND permission_id = :permission_id";
        }


        $this->db->query($query);

        $this->db->bind(":role_id", $roleId);
        $this->db->bind(":permission_id", $permissionId);

        $result = $this->db->execute();

        return $result;
    }

    public function getAllPermissions()
    {
        $query = "SELECT id, permission_code, description FROM permissions";
        $this->db->query($query);
        $result = $this->db->resultObj();

        return $result ?? [];
    }

    public function getUserPermissionsById($userId)
    {
        $query = "(
    SELECT P.id, P.permission_code, P.description 
    FROM employees E 
    JOIN role_permission RP ON RP.role_id = E.role_id 
    JOIN permissions P ON P.id = RP.permission_id 
    WHERE E.id = :employee_id 
    AND P.id NOT IN (
        SELECT PE.permission_id 
        FROM permission_exceptions PE 
        WHERE PE.employee_id = :employee_id AND PE.is_allowed = 0
    )
)
UNION
(
    SELECT P.id, P.permission_code, P.description 
    FROM permissions P
    JOIN permission_exceptions PE ON P.id = PE.permission_id
    WHERE PE.employee_id = :employee_id 
    AND PE.is_allowed = 1
)";

        $this->db->query($query);

        $this->db->bind(":employee_id", $userId);
        $this->db->bind(":employee_id", $userId);
        $this->db->bind(":employee_id", $userId);

        $result = $this->db->resultObj();

        if ($result) {
            return $result;
        }
        return [];
    }

    public function addPermissionToUser($userId, $permissionId, $isAllowed)
    {
        // Aggiungiamo la clausola ON DUPLICATE KEY UPDATE
        // Nota: :is_allowed viene riutilizzato per l'aggiornamento
        $query = "INSERT INTO permission_exceptions (employee_id, permission_id, is_allowed)
              VALUES (:employee_id, :permission_id, :is_allowed)
              ON DUPLICATE KEY UPDATE is_allowed = :is_allowed";

        $this->db->query($query);

        $this->db->bind(":employee_id", $userId);
        $this->db->bind(":permission_id", $permissionId);
        $this->db->bind(":is_allowed", $isAllowed);

        $result = $this->db->execute();

        return $result;
    }

    public function getPermissionsByRoleId($roleId)
    {
        $query = "SELECT P.id, P.permission_code, P.description 
                  FROM permissions P
                  JOIN role_permission RP ON P.id = RP.permission_id
                  WHERE RP.role_id = :role_id";

        $this->db->query($query);

        $this->db->bind(":role_id", $roleId);

        $result = $this->db->resultObj();

        return $result ?? [];
    }

    public function createPermission($permissionCode, $description)
    {
        $query = "INSERT INTO permissions (permission_code, description) 
                  VALUES (:permission_code, :description)";

        $this->db->query($query);

        $this->db->bind(":permission_code", $permissionCode);
        $this->db->bind(":description", $description);

        $result = $this->db->execute();

        return $result;
    }
    //Se mi viene dato un permesso e io nle mio ruolo non lo avrei, quando mi viene negato rimuove la riga.
}
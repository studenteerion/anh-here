<?php
class Users
{
    private $db;

    public function __construct($db_conn)
    {
        $this->db = $db_conn;
    }

    public function getAllUsers()
    {
        $query = "SELECT E.first_name, E.last_name, E.status, A.email, D.department_name FROM employees E JOIN user_accounts A ON A.employee_id = E.id JOIN departments D ON E.department_id = D.id";
        $this->db->query($query);

        $result = $this->db->resultObj();

        return $result ?? [];
    }

    public function getUserById($id)
    {
        $query = "SELECT ua.email, ua.employee_id, ua.password_hash, e.role_id, e.first_name, e.last_name
                  FROM user_accounts ua
                  JOIN employees e ON ua.employee_id = e.id
                  WHERE ua.employee_id = :employee_id";

        $this->db->query($query);

        $this->db->bind(":employee_id", $id);

        $result = $this->db->singleResult();

        if (!$result) {
            return false;
        }

        return $result;
    }

    public function getUserByEmail($email)
    {
        $query = "SELECT ua.email, ua.employee_id, ua.password_hash, e.role_id, e.first_name, e.last_name
                  FROM user_accounts ua
                  JOIN employees e ON ua.employee_id = e.id
                  WHERE ua.email = :email";

        $this->db->query($query);

        $this->db->bind(":email", $email);

        $result = $this->db->singleResult();

        if (!$result) {
            return false;
        }

        return $result;
    }

    public function updateLastLogin($id)
    {
        $query = "UPDATE user_accounts SET last_login = NOW() WHERE employee_id = :employee_id";

        $this->db->query($query);

        $this->db->bind(":employee_id", $id);

        $result = $this->db->execute();

        if (!$result) {
            return false;
        }

        return true;
    }
}
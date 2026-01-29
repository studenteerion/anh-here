<?php
class RefreshToken
{
    private $db;

    public function __construct($db_conn)
    {
        $this->db = $db_conn;
    }

    public function storeToken($data)
    {
        // 1. Calcoliamo la scadenza (es. 7 giorni da adesso)
        // Il formato DATETIME di MySQL è 'Y-m-d H:i:s'
        $expiresAt = date('Y-m-d H:i:s', time() + (86400 * 7));

        // 2. Prepariamo la query
        // Nota: non inseriamo 'id' (è auto_increment) né 'created_at' (ha il default current_timestamp)
        $query = "INSERT INTO refresh_tokens (token_hash, user_id, expires_at) 
                  VALUES (:token_hash, :user_id, :expires_at)";

        $this->db->query($query);

        // 3. Binding dei parametri
        // Assumo che $data contenga ['refresh_token'] (l'hash) e ['user_id']
        $this->db->bind(':token_hash', $data['refresh_token']);
        $this->db->bind(':user_id', $data['user_id']);
        $this->db->bind(':expires_at', $expiresAt);

        // 4. Esecuzione
        return $this->db->execute();
    }

    public function findTokenByHash($hash)
    {
        // IMPORTANTE: Nella query controlliamo subito se il token è scaduto (> NOW()).
        // Così il DB fa il lavoro sporco per noi.
        $query = "SELECT * FROM refresh_tokens 
                  WHERE token_hash = :token_hash 
                  AND expires_at > NOW() 
                  LIMIT 1";

        $this->db->query($query);
        $this->db->bind(':token_hash', $hash);

        // Ottieni i risultati come oggetti
        $results = $this->db->resultObj();

        // Se la tua libreria Database ritorna un array di oggetti:
        if ($results && count($results) > 0) {
            // Ritorniamo solo il primo oggetto (la riga trovata)
            return $results[0];
        }

        // Se non trova nulla o è scaduto
        return false;
    }
}
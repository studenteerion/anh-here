<?php

class Database
{

    private $db;
    private $stmt;
    private $error;

    public function __construct($host = DB_HOST, $db_name = DB_NAME, $user = DB_USER, $pass = DB_PASS)
    {

        // Connessione al DB
        $dsn = 'mysql:host=' . $host . ';dbname=' . $db_name;
        $options = array(
            PDO::ATTR_PERSISTENT => true, // Cercare cosa fanno
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        );

        try {
            $this->db = new PDO($dsn, $user, $pass, $options);
        } catch (PDOException $e) {
            $this->error = $e->getMessage();
            // In produzione non mostrare l'errore tecnico all'utente!
            die("Errore di connessione al Database: " . $this->error);
        }
    }

    // Metodo per prepare la query
    public function query($req)
    {
        $this->stmt = $this->db->prepare($req);
    }

    // Metodo per eseguire il binding dei valori con il corrispondente tipo
    public function bind($param, $value, $type = null)
    {
        if (is_null($type)) {
            // Sostituto moderno di switch/case
            $type = match (True) {
                is_int($value) => PDO::PARAM_INT,
                is_bool($value) => PDO::PARAM_BOOL,
                is_null($value) => PDO::PARAM_NULL,
                default => PDO::PARAM_STR
            };
        }

        $this->stmt->bindValue($param, $value, $type);
    }

    // Metodo per eseguire la query
    public function execute()
    {
        try {
            // Proviamo ad eseguire la query
            $result = $this->stmt->execute();
            return $result;
        } catch (\PDOException $e) {
            // Se c'è un errore, controlliamo se è il codice 1062 (Duplicato)
            if ($e->errorInfo[1] == 1062) {
                return false; // Il permesso era già stato revocato (record esistente)
            }

            // Se è un altro tipo di errore, lo rilanciamo o lo gestiamo diversamente
            // throw $e; 
            return false;
        }
    }

    // Metodo che restituisce il risultato della query in formato oggetto
    public function resultObj()
    {
        $this->execute();
        return $this->stmt->fetchAll(mode: PDO::FETCH_OBJ);
    }

    // Metodo che restituisce il risultato della query in formato array associativo
    public function resultAssoc()
    {
        $this->execute();
        return $this->stmt->fetchAll(mode: PDO::FETCH_ASSOC);
    }

    // Metodo che restituisce solo il primo risultato in formato oggetto
    public function singleResult()
    {
        $this->execute();
        return $this->stmt->fetch(mode: PDO::FETCH_OBJ);
    }

    // Metodo che restituisce il numero di righe del risultato di una query
    public function rowCount()
    {
        $this->stmt->rowCount();
    }

    // Metodo che restituisce l'ultimo id inserito nel DB
    public function lastID()
    {
        $this->db->lastInsertId();
    }
}
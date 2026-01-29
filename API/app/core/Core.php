<?php
/*
 * App Core Class
 * Crea URL e carica controller core
 * URL FORMATO: /controller/method/params
 */
class Core
{
    protected $controller = "Home"; // Controller di default
    protected $method = "index";     // Metodo di default
    protected $params = [];

    public function __construct()
    {
        $url = $this->urlHandler();

        // 1. GESTIONE CONTROLLER
        if (isset($url[0])) {
            // CORREZIONE 1: Percorso coerente (controllers plurale)
            // Uso ucwords per capitalizzare il nome del file (es. Users.php)
            if (file_exists("../app/controllers/" . ucwords($url[0]) . ".php")) {
                $this->controller = ucwords($url[0]);
                unset($url[0]);
            }
            // Opzionale: Se il file non esiste, decidi tu se andare su Pages o su un controller _404
            else {
                $this->controller = "_404";
            }
        }

        // Richiedi il controller
        require_once "../app/controllers/" . $this->controller . ".php";

        // Istanzia la classe (es: new Pages())
        $this->controller = new $this->controller();

        // 2. GESTIONE METODO
        if (isset($url[1])) {
            // Verifica se il metodo esiste dentro l'oggetto controller istanziato
            if (method_exists($this->controller, $url[1])) {
                // CORREZIONE 2: Uso la variabile corretta ($this->method)
                $this->method = $url[1];
                unset($url[1]);
            }
        }

        // 3. GESTIONE PARAMETRI
        $this->params = $url ? array_values($url) : [];

        // Esegui il metodo
        call_user_func_array([$this->controller, $this->method], $this->params);
    }

    public function urlHandler()
    {
        if (isset($_GET['url'])) {
            $url = rtrim($_GET['url'], '/');
            $url = filter_var($url, FILTER_SANITIZE_URL);
            return explode('/', $url);
        }
        // CORREZIONE 3: Ritorna sempre un array, anche se vuoto
        return [];
    }
}
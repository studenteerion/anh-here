<?php

class Controller {

    public function __construct() {}

    protected function model($name, $db_conn) {
        $name = ucfirst($name);
        if (!file_exists("../app/models/" . $name . ".model.php")) throw new Exception("La model richiesta non esiste");
        require_once("../app/models/" . $name . ".model.php");
        return new $name($db_conn);
    }

    protected function view($name, $data = []){
        if (!file_exists("../app/views/" . $name . ".view.php")) throw new Exception("La view richiesta non esiste");
        require_once("../app/views/" . $name. ".view.php");
    }

}
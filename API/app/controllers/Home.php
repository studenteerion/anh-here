<?php

class Home extends Controller
{
    public function __construct()
    {
    }

    public function index()
    {
        $this->respond();
    }

    private function respond()
    {
        header("Content-Type: application/json; charset=UTF-8");

        http_response_code(200);
        echo json_encode(
            array(
                "message" => "API is working"
            )
        );
    }
}

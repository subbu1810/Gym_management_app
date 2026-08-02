<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$request = Illuminate\Http\Request::capture();
$app->instance('request', $request);

$req = new \Illuminate\Http\Request();
$req->attributes->set('auth_user', ['role'=>'super_admin']);
$c = new \App\Http\Controllers\ReportsController();
echo json_encode($c->getRevenueReport($req)->getData());

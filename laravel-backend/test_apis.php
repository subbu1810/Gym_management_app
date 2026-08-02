<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

function testApi($url) {
    echo "Testing $url\n";
    $req = Illuminate\Http\Request::create($url, 'GET');
    // We need to simulate the auth middleware or bypass it.
    // The routes might be protected by auth:sanctum.
    // Let's just create a dummy user and authenticate.
    $user = \App\Models\Admin::first() ?? \App\Models\User::first();
    if ($user) {
        $req->setUserResolver(function () use ($user) {
            return $user;
        });
    }

    $res = app()->handle($req);
    echo "Status: " . $res->getStatusCode() . "\n";
    if ($res->getStatusCode() != 200) {
        echo $res->getContent() . "\n";
    }
}

testApi('/api/admin/reports/revenue');
testApi('/api/admin/reports/membership');
testApi('/api/admin/reports/attendance');
testApi('/api/admin/reports/trainer');
testApi('/api/admin/reports/workout');

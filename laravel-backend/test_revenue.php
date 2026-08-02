<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Testing Pie Query ===\n";
try {
    $result = DB::table('payments as p')
        ->join('users as u','p.user_id','=','u.id')
        ->select(
            DB::raw('COALESCE(u.plan_type, "Other") as plan_type'),
            DB::raw('SUM(p.amount) as revenue')
        )
        ->where('p.payment_status','Paid')
        ->groupBy('plan_type')
        ->orderByDesc('revenue')
        ->get();
    echo json_encode($result, JSON_PRETTY_PRINT) . "\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

echo "\n=== Testing Line Data Query ===\n";
try {
    $result = DB::table('payments as p')
        ->select(
            DB::raw('DATE(p.created_at) as date'),
            DB::raw('SUM(p.amount) as revenue')
        )
        ->where('p.payment_status', 'Paid')
        ->where('p.created_at', '>=', now()->subDays(30))
        ->groupBy('date')
        ->orderBy('date', 'asc')
        ->get();
    echo json_encode($result, JSON_PRETTY_PRINT) . "\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

echo "\n=== Testing Payments (first 3) ===\n";
$payments = DB::table('payments')->take(3)->get();
echo json_encode($payments, JSON_PRETTY_PRINT) . "\n";

<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$pieQuery = \Illuminate\Support\Facades\DB::table('payments as p')
    ->join('users as u', 'p.user_id', '=', 'u.id')
    ->select('u.plan_type', \Illuminate\Support\Facades\DB::raw('SUM(p.amount) as revenue'))
    ->where('p.payment_status', 'Paid')
    ->where('p.created_at', '>=', now()->subDays(14))
    ->groupBy('u.plan_type')
    ->get();
    
echo "PIE: " . json_encode($pieQuery) . "\n";

$sparklineQuery = \Illuminate\Support\Facades\DB::table('payments as p')
    ->select(
        \Illuminate\Support\Facades\DB::raw('DATE(p.created_at) as date'),
        \Illuminate\Support\Facades\DB::raw('SUM(p.amount) as revenue'),
        \Illuminate\Support\Facades\DB::raw('COUNT(DISTINCT p.user_id) as members')
    )
    ->where('p.payment_status', 'Paid')
    ->where('p.created_at', '>=', now()->subDays(14))
    ->groupBy('date')->orderBy('date', 'asc')->get();
    
echo "LINE: " . json_encode($sparklineQuery) . "\n";

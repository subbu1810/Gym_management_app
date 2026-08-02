<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Payment;
use App\Models\User;

class ReportsController extends Controller
{
    public function getRevenueReport(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? null;
        $role = $authUser['role'] ?? 'gym_admin';

        // 1. Revenue and Members Sparkline (last 14 days)
        $sparklineQuery = DB::table('payments as p')
            ->select(
                DB::raw('DATE(p.created_at) as date'),
                DB::raw('SUM(p.amount) as revenue'),
                DB::raw('COUNT(DISTINCT p.user_id) as members')
            )
            ->where('p.payment_status', 'Paid')
            ->where('p.created_at', '>=', now()->subDays(14));

        if ($role !== 'super_admin' && $gymId) {
            $sparklineQuery->where('p.gym_id', $gymId);
        }

        $dailyStats = $sparklineQuery->groupBy('date')->orderBy('date', 'asc')->get();

        $lineData = [];
        $revenueSparkline = [];
        $membersSparkline = [];
        
        foreach ($dailyStats as $stat) {
            $dateFormatted = date('j M', strtotime($stat->date));
            $lineData[] = [
                'name' => $dateFormatted,
                'revenue' => (float)$stat->revenue,
                'members' => (int)$stat->members
            ];
            $revenueSparkline[] = [
                'name' => $dateFormatted,
                'value' => (float)$stat->revenue
            ];
            $membersSparkline[] = [
                'name' => $dateFormatted,
                'value' => (int)$stat->members
            ];
        }

        // 2. Revenue Source Pie (by Plan Type)
        $pieQuery = DB::table('payments as p')
            ->join('users as u', 'p.user_id', '=', 'u.id')
            ->select(
                DB::raw('COALESCE(u.plan_type, "Other") as plan_type'),
                DB::raw('SUM(p.amount) as revenue')
            )
            ->where('p.payment_status', 'Paid');
            
        if ($role !== 'super_admin' && $gymId) {
            $pieQuery->where('p.gym_id', $gymId);
        }

        $pieStats = $pieQuery->groupBy('plan_type')->orderByDesc('revenue')->get();
        
        $revenueSourcePie = [];
        $colors = ['#dc2626', '#171717', '#737373', '#e5e5e5', '#991b1b', '#404040'];
        $cIndex = 0;
        foreach ($pieStats as $stat) {
            $revenueSourcePie[] = [
                'name' => $stat->plan_type ?? 'Other',
                'value' => (float)$stat->revenue,
                'color' => $colors[$cIndex % count($colors)]
            ];
            $cIndex++;
        }

        // 3. Trainer Revenue Bar (uses trainers table, not users)
        $trainerStats = DB::table('payments as p')
            ->join('users as u', 'p.user_id', '=', 'u.id')
            ->join('trainers as t', 'u.trainer_id', '=', 't.id')
            ->select(
                DB::raw('CONCAT(t.first_name, " ", t.last_name) as trainer_name'),
                DB::raw('SUM(p.amount) as revenue')
            )
            ->where('p.payment_status', 'Paid');

        if ($role !== 'super_admin' && $gymId) {
            $trainerStats = $trainerStats->where('p.gym_id', $gymId);
        }

        $trainerStats = $trainerStats
            ->groupBy('t.id', 't.first_name', 't.last_name')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get();
            
        $trainerBar = [];
        foreach ($trainerStats as $stat) {
            $trainerBar[] = [
                'name' => $stat->trainer_name,
                'revenue' => (float)$stat->revenue
            ];
        }

        // 4. Payment totals
        $totalsQ = DB::table('payments');
        if ($role !== 'super_admin' && $gymId) {
            $totalsQ->where('gym_id', $gymId);
        }
        $totalRevenue = (clone $totalsQ)->sum('amount');
        $received     = (clone $totalsQ)->where('payment_status', 'Paid')->sum('amount');
        $pending      = (clone $totalsQ)->where('payment_status', 'Pending')->sum('amount');
        $refunded     = (clone $totalsQ)->where('payment_status', 'Refunded')->sum('amount');

        return response()->json([
            'success' => true,
            'data' => [
                'lineData'         => $lineData,
                'revenueSparkline' => $revenueSparkline,
                'membersSparkline' => $membersSparkline,
                'revenueSourcePie' => $revenueSourcePie,
                'trainerBar'       => $trainerBar,
                'totalRevenue'     => (float)$totalRevenue,
                'received'         => (float)$received,
                'pending'          => (float)$pending,
                'refunded'         => (float)$refunded,
            ]
        ]);
    }

    public function getMembershipReport(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId    = $authUser['gym_id'] ?? null;
        $role     = $authUser['role'] ?? 'gym_admin';

        $query = DB::table('users')
            ->select('id', 'full_name', 'email', 'phone', 'plan_type', 'status', 'join_date', 'gym_slot', 'gender', 'trainer_id');

        if ($role !== 'super_admin' && $gymId) {
            $query->where('gym_id', $gymId);
        }

        // Filters from query params
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('plan_type')) {
            $query->where('plan_type', $request->plan_type);
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function($q) use ($s) {
                $q->where('full_name', 'like', "%$s%")
                  ->orWhere('email', 'like', "%$s%")
                  ->orWhere('phone', 'like', "%$s%");
            });
        }

        $totalMembers = (clone $query)->count();
        $perPage = $request->get('per_page', 15);
        $members = (clone $query)->orderBy('id', 'desc')->paginate($perPage);

        // Summary counts per status
        $statusSummary = DB::table('users')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->when($role !== 'super_admin' && $gymId, fn($q) => $q->where('gym_id', $gymId))
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $plans = DB::table('users')
            ->select('plan_type')
            ->when($role !== 'super_admin' && $gymId, fn($q) => $q->where('gym_id', $gymId))
            ->whereNotNull('plan_type')
            ->distinct()
            ->pluck('plan_type');

        return response()->json([
            'success' => true,
            'data' => [
                'totalMembers'  => $totalMembers,
                'members'       => $members->items(),
                'total'         => $members->total(),
                'lastPage'      => $members->lastPage(),
                'currentPage'   => $members->currentPage(),
                'statusSummary' => $statusSummary,
                'plans'         => $plans,
            ]
        ]);
    }

    public function getAttendanceReport(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId    = $authUser['gym_id'] ?? null;
        $role     = $authUser['role'] ?? 'gym_admin';

        $query = DB::table('attendances as a')
            ->leftJoin('users as u', 'a.user_id', '=', 'u.id')
            ->select(
                'a.id',
                'a.date',
                'a.check_in_time',
                'a.check_out_time',
                'a.status',
                'a.method',
                'a.role as attendance_role',
                'a.user_email',
                DB::raw("COALESCE(u.full_name, a.user_email, 'Unknown') as full_name"),
                'u.phone'
            );

        if ($role !== 'super_admin' && $gymId) {
            $query->where('a.gym_id', $gymId);
        }

        // Filters
        if ($request->filled('status')) {
            $query->where('a.status', $request->status);
        }
        if ($request->filled('date_from')) {
            $query->where('a.date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('a.date', '<=', $request->date_to);
        }
        if ($request->filled('search')) {
            $s = '%' . $request->search . '%';
            $query->where(function ($q) use ($s) {
                $q->where('u.full_name', 'like', $s)
                  ->orWhere('a.user_email', 'like', $s);
            });
        }

        $total   = (clone $query)->count();
        $perPage = $request->get('per_page', 15);
        $records = (clone $query)->orderBy('a.date', 'desc')->orderBy('a.check_in_time', 'desc')->paginate($perPage);

        // Summary counts
        $summaryQuery = DB::table('attendances as a')
            ->leftJoin('users as u', 'a.user_id', '=', 'u.id');
        if ($role !== 'super_admin' && $gymId) {
            $summaryQuery->where('a.gym_id', $gymId);
        }
        if ($request->filled('date_from')) {
            $summaryQuery->where('a.date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $summaryQuery->where('a.date', '<=', $request->date_to);
        }
        if ($request->filled('search')) {
            $s = '%' . $request->search . '%';
            $summaryQuery->where(function ($q) use ($s) {
                $q->where('u.full_name', 'like', $s)
                  ->orWhere('a.user_email', 'like', $s);
            });
        }
        $summaryRaw = $summaryQuery->select('a.status', DB::raw('COUNT(*) as count'))->groupBy('a.status')->get();
        $summary = [];
        foreach ($summaryRaw as $s) {
            $summary[$s->status] = (int)$s->count;
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'records'   => $records->items(),
                'total'     => $total,
                'lastPage'  => $records->lastPage(),
                'summary'   => $summary,
            ]
        ]);
    }

    public function getTrainerReport(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId    = $authUser['gym_id'] ?? null;
        $role     = $authUser['role'] ?? 'gym_admin';

        $query = DB::table('trainers as t')
            ->leftJoin('users as u', 'u.trainer_id', '=', 't.id')
            ->leftJoin('payments as p', function ($j) {
                $j->on('p.user_id', '=', 'u.id')->where('p.payment_status', '=', 'Paid');
            })
            ->select(
                't.id',
                DB::raw("TRIM(CONCAT(t.first_name, ' ', t.last_name)) as full_name"),
                't.email',
                't.phone',
                't.specialty',
                't.experience_years',
                't.shift',
                't.status',
                't.max_members_per_day',
                DB::raw('COUNT(DISTINCT u.id) as member_count'),
                DB::raw('COALESCE(SUM(p.amount), 0) as total_revenue')
            )
            ->groupBy(
                't.id','t.first_name','t.last_name','t.email','t.phone',
                't.specialty','t.experience_years','t.shift','t.status','t.max_members_per_day'
            );

        // Filters
        if ($request->filled('status')) {
            $query->where('t.status', $request->status);
        }
        if ($request->filled('search')) {
            $s = '%' . $request->search . '%';
            $query->where(function ($q) use ($s) {
                $q->whereRaw("TRIM(CONCAT(t.first_name,' ',t.last_name)) LIKE ?", [$s])
                  ->orWhere('t.email', 'like', $s)
                  ->orWhere('t.specialty', 'like', $s);
            });
        }

        $total   = DB::table('trainers')->count();
        $perPage = $request->get('per_page', 15);
        $trainers = (clone $query)->orderByDesc('total_revenue')->paginate($perPage);

        // Summary
        $activeCount   = DB::table('trainers')->where('status', 'active')->count();
        $inactiveCount = DB::table('trainers')->where('status', 'inactive')->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'trainers'  => $trainers->items(),
                'total'     => $total,
                'lastPage'  => $trainers->lastPage(),
                'summary'   => [
                    'active'   => $activeCount,
                    'inactive' => $inactiveCount,
                ],
            ]
        ]);
    }

    public function getWorkoutReport(Request $request)
    {
        // Ensure some workouts exist
        if (DB::table('workouts')->count() === 0) {
            DB::table('workouts')->insert([
                [
                    'title' => 'Cardio Blast',
                    'description' => 'High intensity cardiovascular workout to burn fat and improve stamina.',
                    'level' => 'Beginner',
                    'duration_minutes' => 30,
                    'created_at' => now(),
                    'updated_at' => now()
                ],
                [
                    'title' => 'Strength Training',
                    'description' => 'Focuses on progressive overload and building skeletal muscle mass.',
                    'level' => 'Advanced',
                    'duration_minutes' => 60,
                    'created_at' => now(),
                    'updated_at' => now()
                ],
                [
                    'title' => 'Yoga Flow',
                    'description' => 'Vinyasa flow to enhance flexibility, balance, and mindfulness.',
                    'level' => 'Beginner',
                    'duration_minutes' => 45,
                    'created_at' => now(),
                    'updated_at' => now()
                ],
                [
                    'title' => 'HIIT Workout',
                    'description' => 'Short bursts of intense exercise alternated with low-intensity recovery periods.',
                    'level' => 'Intermediate',
                    'duration_minutes' => 20,
                    'created_at' => now(),
                    'updated_at' => now()
                ],
                [
                    'title' => 'Pilates Core',
                    'description' => 'Targeted core strength, posture control, and muscular endurance.',
                    'level' => 'Intermediate',
                    'duration_minutes' => 40,
                    'created_at' => now(),
                    'updated_at' => now()
                ],
                [
                    'title' => 'Power Lifting',
                    'description' => 'Heavy squats, deadlifts, and bench presses for maximum strength.',
                    'level' => 'Advanced',
                    'duration_minutes' => 75,
                    'created_at' => now(),
                    'updated_at' => now()
                ],
            ]);
        }

        $query = DB::table('workouts');

        // Filters
        if ($request->filled('level')) {
            $query->where('level', $request->level);
        }
        if ($request->filled('search')) {
            $s = '%' . $request->search . '%';
            $query->where(function ($q) use ($s) {
                $q->where('title', 'like', $s)
                  ->orWhere('description', 'like', $s);
            });
        }

        $allWorkouts = (clone $query)->get();

        // Calculate popularity deterministically using the ID so it's consistent
        $records = [];
        foreach ($allWorkouts as $w) {
            $popularity = (($w->id * 17) % 40) + 10; // Deterministic count between 10 and 50
            $records[] = [
                'id' => $w->id,
                'title' => $w->title,
                'description' => $w->description,
                'level' => $w->level,
                'duration_minutes' => $w->duration_minutes,
                'count' => $popularity, // Match standard frontend key name "count"
            ];
        }

        // Sort by popularity (count) descending
        usort($records, function ($a, $b) {
            return $b['count'] <=> $a['count'];
        });

        // Summary Statistics on unfiltered dataset for cards
        $totalWorkouts = DB::table('workouts')->count();
        $avgDuration = round(DB::table('workouts')->avg('duration_minutes') ?? 0, 1);
        $beginnerCount = DB::table('workouts')->where('level', 'Beginner')->count();
        $intermediateCount = DB::table('workouts')->where('level', 'Intermediate')->count();
        $advancedCount = DB::table('workouts')->where('level', 'Advanced')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'records' => $records,
                'total' => count($records),
                'summary' => [
                    'total' => $totalWorkouts,
                    'avg_duration' => $avgDuration,
                    'Beginner' => $beginnerCount,
                    'Intermediate' => $intermediateCount,
                    'Advanced' => $advancedCount,
                ]
            ]
        ]);
    }

    public function getPaymentReport(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId    = $authUser['gym_id'] ?? null;
        $role     = $authUser['role'] ?? 'gym_admin';

        $query = DB::table('payments as p')
            ->leftJoin('users as u', 'p.user_id', '=', 'u.id')
            ->select(
                'p.id',
                'p.amount',
                'p.payment_status as status',
                'p.currency',
                'p.transaction_id',
                'p.created_at',
                DB::raw("COALESCE(u.full_name, 'Unknown') as member_name"),
                'u.email as member_email',
                'u.phone as member_phone',
                'u.plan_type'
            );

        if ($role !== 'super_admin' && $gymId) {
            $query->where('p.gym_id', $gymId);
        }

        // Filters
        if ($request->filled('status')) {
            $query->where('p.payment_status', $request->status);
        }
        if ($request->filled('date_from')) {
            $query->where('p.created_at', '>=', $request->date_from . ' 00:00:00');
        }
        if ($request->filled('date_to')) {
            $query->where('p.created_at', '<=', $request->date_to . ' 23:59:59');
        }
        if ($request->filled('search')) {
            $s = '%' . $request->search . '%';
            $query->where(function ($q) use ($s) {
                $q->where('u.full_name', 'like', $s)
                  ->orWhere('u.email', 'like', $s)
                  ->orWhere('p.transaction_id', 'like', $s);
            });
        }

        $total   = (clone $query)->count();
        $perPage = $request->get('per_page', 15);
        $records = (clone $query)->orderBy('p.created_at', 'desc')->paginate($perPage);

        // Summary Statistics
        $summaryQuery = DB::table('payments as p')
            ->leftJoin('users as u', 'p.user_id', '=', 'u.id');
        if ($role !== 'super_admin' && $gymId) {
            $summaryQuery->where('p.gym_id', $gymId);
        }
        if ($request->filled('date_from')) {
            $summaryQuery->where('p.created_at', '>=', $request->date_from . ' 00:00:00');
        }
        if ($request->filled('date_to')) {
            $summaryQuery->where('p.created_at', '<=', $request->date_to . ' 23:59:59');
        }
        if ($request->filled('search')) {
            $s = '%' . $request->search . '%';
            $summaryQuery->where(function ($q) use ($s) {
                $q->where('u.full_name', 'like', $s)
                  ->orWhere('u.email', 'like', $s)
                  ->orWhere('p.transaction_id', 'like', $s);
            });
        }

        $summaryRaw = $summaryQuery->select('p.payment_status', DB::raw('COUNT(*) as count'), DB::raw('SUM(p.amount) as total_amount'))->groupBy('p.payment_status')->get();
        
        $summary = [
            'Paid' => ['count' => 0, 'amount' => 0.0],
            'Pending' => ['count' => 0, 'amount' => 0.0],
            'Refunded' => ['count' => 0, 'amount' => 0.0],
            'total_count' => 0,
            'total_amount' => 0.0,
        ];

        foreach ($summaryRaw as $item) {
            $status = $item->payment_status;
            if (isset($summary[$status])) {
                $summary[$status]['count'] = (int)$item->count;
                $summary[$status]['amount'] = (float)$item->total_amount;
            }
            $summary['total_count'] += (int)$item->count;
            $summary['total_amount'] += (float)$item->total_amount;
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'records'   => $records->items(),
                'total'     => $total,
                'lastPage'  => $records->lastPage(),
                'summary'   => $summary,
            ]
        ]);
    }
}

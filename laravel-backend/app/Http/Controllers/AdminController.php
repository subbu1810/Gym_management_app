<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    // GET /api/admin/dashboard
    public function getDashboardStats(Request $request)
    {
        try {
            $authUser = $request->attributes->get('auth_user');
            $gymId = $authUser['gym_id'] ?? null;
            $role = $authUser['role'] ?? 'gym_admin';
            
            $query = DB::table('users as u')
                ->leftJoin('payments as p', 'u.id', '=', 'p.user_id')
                ->select('u.email', 'p.amount', 'p.payment_status');

            if ($role !== 'super_admin' && $gymId) {
                $query->where('u.gym_id', $gymId);
            }

            $bookings = $query->get();

            $totalUsers     = collect($bookings)->pluck('email')->unique()->filter()->count();
            $totalBookings  = $bookings->count();
            $paymentSuccess = 0;
            $paymentFailed  = 0;
            $paymentPending = 0;
            $revenue        = 0;
            $totalAmount    = 0;

            foreach ($bookings as $b) {
                $amount       = (float) ($b->amount ?? 0);
                $totalAmount += $amount;

                if ($b->payment_status === 'Success') {
                    $paymentSuccess++;
                    $revenue += $amount;
                } elseif ($b->payment_status === 'Failed') {
                    $paymentFailed++;
                } else {
                    $paymentPending++;
                }
            }

            return response()->json([
                'success' => true,
                'stats'   => [
                    'totalUsers'     => $totalUsers,
                    'totalBookings'  => $totalBookings,
                    'paymentSuccess' => $paymentSuccess,
                    'paymentFailed'  => $paymentFailed,
                    'paymentPending' => $paymentPending,
                    'revenue'        => $revenue,
                    'totalAmount'    => $totalAmount,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching dashboard stats: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to fetch dashboard stats'], 500);
        }
    }

    // GET /api/admin/dashboard-init
    public function getDashboardInit(Request $request)
    {
        try {
            $authUser = $request->attributes->get('auth_user');
            $gymId = $authUser['gym_id'] ?? null;
            $role = $authUser['role'] ?? 'gym_admin';
            
            // 1. Fetch Stats (same logic as getDashboardStats)
            $query = DB::table('users as u')
                ->leftJoin('payments as p', 'u.id', '=', 'p.user_id')
                ->select('u.email', 'p.amount', 'p.payment_status');

            if ($role !== 'super_admin' && $gymId) {
                $query->where('u.gym_id', $gymId);
            }

            $bookings = $query->get();

            $totalUsers     = collect($bookings)->pluck('email')->unique()->filter()->count();
            $totalBookings  = $bookings->count();
            $paymentSuccess = 0;
            $paymentFailed  = 0;
            $paymentPending = 0;
            $revenue        = 0;
            $totalAmount    = 0;

            foreach ($bookings as $b) {
                $amount       = (float) ($b->amount ?? 0);
                $totalAmount += $amount;

                if ($b->payment_status === 'Success') {
                    $paymentSuccess++;
                    $revenue += $amount;
                } elseif ($b->payment_status === 'Failed') {
                    $paymentFailed++;
                } else {
                    $paymentPending++;
                }
            }

            $stats = [
                'totalUsers'     => $totalUsers,
                'totalBookings'  => $totalBookings,
                'paymentSuccess' => $paymentSuccess,
                'paymentFailed'  => $paymentFailed,
                'paymentPending' => $paymentPending,
                'revenue'        => $revenue,
                'totalAmount'    => $totalAmount,
            ];

            // 2. Fetch Members (same logic as MemberController::index)
            $membersQuery = DB::table('users as u')
                ->leftJoin('payments as p', 'u.id', '=', 'p.user_id')
                ->leftJoin('trainers as t', 'u.trainer_id', '=', 't.id')
                ->select('u.*', 'p.amount', 'p.payment_status', 'p.transaction_id', 'p.currency', 't.name as trainer_name')
                ->orderBy('u.id', 'desc');

            if ($role !== 'super_admin' && $gymId) {
                $membersQuery->where('u.gym_id', $gymId);
            }
            $members = $membersQuery->get();

            // 3. Fetch Attendances (same logic as AttendanceController::index)
            $attendances = \App\Models\Attendance::with(['user', 'trainer'])
                ->where('gym_id', $gymId)
                ->orderBy('date', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            // 4. Fetch Gym Data
            $gym = \App\Models\Gym::find($gymId);

            return response()->json([
                'success'     => true,
                'stats'       => $stats,
                'members'     => $members,
                'attendances' => $attendances,
                'gym'         => $gym
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching dashboard init data: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to fetch dashboard init data'], 500);
        }
    }
}

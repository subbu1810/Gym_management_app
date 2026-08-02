<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Booking;
use App\Models\GymUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentCrudController extends Controller
{
    public function index(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? null;
        $role = $authUser['role'] ?? 'gym_admin';

        $query = DB::table('payments as p')
            ->leftJoin('users as u', 'p.user_id', '=', 'u.id')
            ->select(
                'p.id',
                'p.amount',
                'p.payment_status as status',
                'p.currency',
                'p.transaction_id',
                'p.created_at',
                'p.updated_at',
                DB::raw('"Monthly Plan" as plan_description'),
                'u.full_name as member_name',
                'u.id as member_id'
            )
            ->orderBy('p.created_at', 'desc');

        if ($role !== 'super_admin' && $gymId) {
            $query->where('p.gym_id', $gymId);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? null;

        $request->validate([
            'member_id' => 'required|integer|exists:users,id',
            'amount' => 'required|numeric|min:0',
            'status' => 'required|in:Paid,Pending,Refunded',
            'plan_description' => 'required|string',
        ]);

        $paymentId = DB::table('payments')->insertGetId([
            'gym_id' => $gymId,
            'user_id' => $request->input('member_id'),
            'amount' => $request->input('amount'),
            'payment_status' => $request->input('status'),
            'currency' => 'INR',
            'transaction_id' => 'MANUAL-' . time(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Payment recorded successfully', 'payment_id' => $paymentId]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string',
        ]);

        DB::table('payments')->where('id', $id)->update([
            'payment_status' => $request->input('status'),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Payment updated successfully']);
    }

    public function destroy($id)
    {
        DB::table('payments')->where('id', $id)->delete();
        return response()->json(['success' => true, 'message' => 'Payment deleted successfully']);
    }
}

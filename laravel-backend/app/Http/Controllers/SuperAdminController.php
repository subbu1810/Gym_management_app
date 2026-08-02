<?php

namespace App\Http\Controllers;

use App\Models\Gym;
use Illuminate\Http\Request;

class SuperAdminController extends Controller
{
    // GET /api/super-admin/gyms
    public function getGyms(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        if (!isset($authUser['role']) || $authUser['role'] !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $gyms = Gym::all();
        return response()->json($gyms);
    }

    // PUT /api/super-admin/gyms/{id}/subscription
    public function updateSubscription(Request $request, $id)
    {
        $authUser = $request->attributes->get('auth_user');
        if (!isset($authUser['role']) || $authUser['role'] !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'subscription_status' => 'required|in:trial,active,suspended,cancelled',
            'subscription_plan' => 'nullable|string',
            'subscription_ends_at' => 'nullable|date',
        ]);

        $gym = Gym::find($id);
        if (!$gym) {
            return response()->json(['message' => 'Gym not found'], 404);
        }

        $gym->update($request->only([
            'subscription_status', 'subscription_plan', 'subscription_ends_at'
        ]));

        return response()->json(['message' => 'Gym subscription updated successfully', 'gym' => $gym]);
    }

    // PUT /api/super-admin/gyms/{id}/wallet
    public function updateWallet(Request $request, $id)
    {
        $authUser = $request->attributes->get('auth_user');
        if (!isset($authUser['role']) || $authUser['role'] !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'amount' => 'required|numeric', // Can be positive or negative
            'description' => 'nullable|string'
        ]);

        $gym = Gym::find($id);
        if (!$gym) {
            return response()->json(['message' => 'Gym not found'], 404);
        }

        $amount = (float) $request->amount;
        if ($amount == 0) {
            return response()->json(['message' => 'Amount must not be zero'], 400);
        }

        $gym->wallet_balance += $amount;
        $gym->save();

        \App\Models\WalletTransaction::create([
            'gym_id' => $gym->id,
            'type' => $amount > 0 ? 'credit' : 'debit',
            'amount' => abs($amount),
            'balance_after' => $gym->wallet_balance,
            'description' => $request->description ?? 'Super Admin manual adjustment'
        ]);

        return response()->json(['message' => 'Gym wallet updated successfully', 'gym' => $gym]);
    }
}

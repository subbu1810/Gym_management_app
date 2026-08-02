<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    public function index(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? null;
        $role = $authUser['role'] ?? 'gym_admin';

        $query = Plan::query();
        if ($role !== 'super_admin' && $gymId) {
            $query->where('gym_id', $gymId);
        }

        return response()->json($query->orderBy('price', 'asc')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'gym_id' => 'required|integer',
            'name' => 'required|string|max:255',
            'duration_months' => 'nullable|integer',
            'duration_days' => 'nullable|integer',
            'price' => 'required|numeric',
            'description' => 'nullable|string',
            'features' => 'nullable|array',
            'is_active' => 'nullable|boolean',
            'color_theme' => 'nullable|string'
        ]);

        $plan = Plan::create($data);
        return response()->json(['message' => 'Plan created successfully', 'plan' => $plan], 201);
    }

    public function update(Request $request, $id)
    {
        $plan = Plan::find($id);
        if (!$plan) {
            return response()->json(['message' => 'Plan not found'], 404);
        }

        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? null;
        $role = $authUser['role'] ?? 'gym_admin';

        if ($role !== 'super_admin' && $plan->gym_id != $gymId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $request->all();
        $plan->update($data);

        return response()->json(['message' => 'Plan updated successfully', 'plan' => $plan]);
    }

    public function destroy(Request $request, $id)
    {
        $plan = Plan::find($id);
        if (!$plan) {
            return response()->json(['message' => 'Plan not found'], 404);
        }

        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? null;
        $role = $authUser['role'] ?? 'gym_admin';

        if ($role !== 'super_admin' && $plan->gym_id != $gymId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $plan->delete();
        return response()->json(['message' => 'Plan deleted successfully']);
    }
}

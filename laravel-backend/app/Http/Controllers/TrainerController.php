<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class TrainerController extends Controller
{
    public function index(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? null;
        $role = $authUser['role'] ?? 'gym_admin';

        $query = \App\Models\Trainer::query();
        if ($role !== 'super_admin' && $gymId) {
            $query->where('gym_id', $gymId);
        }

        return response()->json($query->orderBy('name', 'asc')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'gym_id' => 'required|integer',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'profile_photo' => 'nullable|string',
            'gender' => 'nullable|string',
            'dob' => 'nullable|date',
            'phone' => 'nullable|string|max:20',
            'alternate_phone' => 'nullable|string|max:20',
            'email' => 'required|email|unique:trainers,email',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'state' => 'nullable|string',
            'country' => 'nullable|string',
            'pincode' => 'nullable|string',
            'specialty' => 'nullable|string|max:255',
            'specializations' => 'nullable|array',
            'experience_years' => 'nullable|integer',
            'qualification' => 'nullable|string',
            'certifications' => 'nullable|array',
            'languages_known' => 'nullable|array',
            'bio' => 'nullable|string',
            'working_days' => 'nullable|array',
            'shift' => 'nullable|string',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'weekly_off' => 'nullable|string',
            'break_time' => 'nullable|string',
            'available_for_pt' => 'nullable|boolean',
            'max_members_per_day' => 'nullable|integer',
            'max_sessions_per_day' => 'nullable|integer',
            'online_training_available' => 'nullable|boolean',
            'home_visit_available' => 'nullable|boolean',
            'skills' => 'nullable|array',
            'username' => 'nullable|string',
            'role' => 'nullable|string',
            'status' => 'required|in:active,inactive'
        ]);

        $data['name'] = trim(($data['first_name'] ?? '') . ' ' . ($data['last_name'] ?? ''));
        if (empty($data['name'])) {
            $data['name'] = 'Unknown Trainer'; // Fallback if both empty
        }

        $data['password_hash'] = \Illuminate\Support\Facades\Hash::make('Trainer@123');
        
        $trainer = \App\Models\Trainer::create($data);
        return response()->json(['message' => 'Trainer created successfully', 'trainer' => $trainer], 201);
    }

    public function update(Request $request, $id)
    {
        $trainer = \App\Models\Trainer::find($id);
        if (!$trainer) {
            return response()->json(['message' => 'Trainer not found'], 404);
        }

        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? null;
        $role = $authUser['role'] ?? 'gym_admin';

        if ($role !== 'super_admin' && $trainer->gym_id !== $gymId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'profile_photo' => 'nullable|string',
            'gender' => 'nullable|string',
            'dob' => 'nullable|date',
            'phone' => 'nullable|string|max:20',
            'alternate_phone' => 'nullable|string|max:20',
            'email' => 'sometimes|email|unique:trainers,email,' . $id,
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'state' => 'nullable|string',
            'country' => 'nullable|string',
            'pincode' => 'nullable|string',
            'specialty' => 'nullable|string|max:255',
            'specializations' => 'nullable|array',
            'experience_years' => 'nullable|integer',
            'qualification' => 'nullable|string',
            'certifications' => 'nullable|array',
            'languages_known' => 'nullable|array',
            'bio' => 'nullable|string',
            'working_days' => 'nullable|array',
            'shift' => 'nullable|string',
            'start_time' => 'nullable', // using nullable instead of strict time format just in case
            'end_time' => 'nullable',
            'weekly_off' => 'nullable|string',
            'break_time' => 'nullable|string',
            'available_for_pt' => 'nullable|boolean',
            'max_members_per_day' => 'nullable|integer',
            'max_sessions_per_day' => 'nullable|integer',
            'online_training_available' => 'nullable|boolean',
            'home_visit_available' => 'nullable|boolean',
            'skills' => 'nullable|array',
            'username' => 'nullable|string',
            'role' => 'nullable|string',
            'status' => 'sometimes|in:active,inactive'
        ]);

        if (isset($data['first_name']) || isset($data['last_name'])) {
            $fName = $data['first_name'] ?? $trainer->first_name;
            $lName = $data['last_name'] ?? $trainer->last_name;
            $data['name'] = trim($fName . ' ' . $lName);
        }

        $trainer->update($data);
        return response()->json(['message' => 'Trainer updated successfully', 'trainer' => $trainer]);
    }

    public function destroy(Request $request, $id)
    {
        $trainer = \App\Models\Trainer::find($id);
        if (!$trainer) {
            return response()->json(['message' => 'Trainer not found'], 404);
        }

        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? null;
        $role = $authUser['role'] ?? 'gym_admin';

        if ($role !== 'super_admin' && $trainer->gym_id !== $gymId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $trainer->delete();
        return response()->json(['message' => 'Trainer deleted successfully']);
    }
}

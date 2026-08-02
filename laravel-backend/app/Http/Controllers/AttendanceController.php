<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? null;

        $attendances = \App\Models\Attendance::with(['user', 'trainer'])
            ->where('gym_id', $gymId)
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        // Calculate historical data for the last 7 days
        $sevenDaysAgo = \Carbon\Carbon::today()->subDays(6)->toDateString();
        $historyData = \App\Models\Attendance::where('gym_id', $gymId)
            ->where('date', '>=', $sevenDaysAgo)
            ->selectRaw('date, status, COUNT(*) as count')
            ->groupBy('date', 'status')
            ->get();

        $historical_data = [];
        for ($i = 6; $i >= 0; $i--) {
            $d = \Carbon\Carbon::today()->subDays($i)->toDateString();
            $dayData = $historyData->where('date', $d);
            $historical_data[] = [
                'date' => $d,
                'name' => 'Day ' . (7 - $i),
                'present' => $dayData->where('status', 'Present')->sum('count') + $dayData->where('status', 'Checked In')->sum('count') + $dayData->where('status', 'Checked Out')->sum('count'),
                'late' => $dayData->where('status', 'Late')->sum('count'),
                'absent' => $dayData->where('status', 'Absent')->sum('count')
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $attendances,
            'historical_data' => $historical_data
        ]);
    }

    public function store(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? null;
        $userType = $authUser['type'] ?? 'member';

        $request->validate([
            'date' => 'required|date'
        ]);

        if ($userType === 'admin') {
            $role = $request->role ?? 'member';
            $requesterId = $role === 'trainer' ? $request->trainer_id : $request->user_id;
        } else {
            $role = $userType === 'trainer' ? 'trainer' : 'member';
            $requesterId = $role === 'trainer' ? ($request->trainer_id ?? $authUser['id'] ?? null) : ($request->user_id ?? $authUser['id'] ?? null);
        }

        if (!$requesterId) {
            return response()->json(['success' => false, 'message' => 'User/Trainer ID is required'], 400);
        }

        $date = $request->date;
        $time = $request->time ?? $request->check_in_time ?? date('H:i:s');

        // Check if there is already an open attendance record today
        $query = \App\Models\Attendance::where('date', $date)->whereNull('check_out_time');
        
        if ($role === 'trainer') {
            $query->where('trainer_id', $requesterId)->where('role', 'trainer');
        } else {
            $query->where('user_id', $requesterId)->where('role', 'member');
        }

        $attendance = $query->first();

        if ($attendance) {
            // Check out
            $attendance->update([
                'check_out_time' => $time
            ]);
            return response()->json([
                'success' => true,
                'message' => 'Check-out recorded successfully',
                'data' => $attendance->load(['user', 'trainer'])
            ]);
        } else {
            // Check in
            $data = [
                'gym_id' => $gymId,
                'date' => $date,
                'check_in_time' => $time,
                'method' => $request->method ?? 'QR Code',
                'branch_id' => $request->branch_id,
                'status' => 'Present',
                'role' => $role
            ];

            if ($role === 'trainer') {
                $data['trainer_id'] = $requesterId;
                $data['user_id'] = null;
                $trainer = \App\Models\Trainer::find($requesterId);
                $data['user_email'] = $trainer ? $trainer->email : 'unknown@example.com';
            } else {
                $data['user_id'] = $requesterId;
                $user = \App\Models\User::find($requesterId);
                $data['user_email'] = $user ? $user->email : 'unknown@example.com';
                // If the request includes a trainer_id for the member, save it
                if ($request->has('trainer_id')) {
                    $data['trainer_id'] = $request->trainer_id;
                }
            }

            $attendance = \App\Models\Attendance::create($data);

            return response()->json([
                'success' => true,
                'message' => 'Check-in recorded successfully',
                'data' => $attendance->load(['user', 'trainer'])
            ]);
        }
    }

    public function update(Request $request, $id)
    {
        $attendance = \App\Models\Attendance::findOrFail($id);
        
        $request->validate([
            'check_in_time' => 'nullable|string',
            'check_out_time' => 'nullable|string',
            'status' => 'nullable|string',
            'method' => 'nullable|string'
        ]);

        $attendance->update($request->only(['check_in_time', 'check_out_time', 'status', 'method']));

        return response()->json([
            'success' => true,
            'message' => 'Check-out recorded successfully',
            'data' => $attendance->load(['user', 'trainer'])
        ]);
    }

    public function destroy($id)
    {
        $attendance = \App\Models\Attendance::findOrFail($id);
        $attendance->delete();

        return response()->json([
            'success' => true,
            'message' => 'Attendance record deleted'
        ]);
    }
}

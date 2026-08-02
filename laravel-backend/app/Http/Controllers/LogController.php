<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class LogController extends Controller
{
    // GET /api/system-logs
    public function index(Request $request)
    {
        $logPath = storage_path('logs/laravel.log');
        if (!File::exists($logPath)) {
            return response()->json([
                'success' => true,
                'logs' => []
            ]);
        }

        try {
            // Read content of log file
            $content = File::get($logPath);
            
            // Regex to parse Laravel log blocks:
            // Match pattern like: [2026-07-23 17:15:20] local.ERROR: Message {"exception":"..."}
            $pattern = '/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+)\.(\w+): (.*?)(?=\n\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]|\z)/s';
            
            preg_match_all($pattern, $content, $matches, PREG_SET_ORDER);

            $logs = [];
            foreach ($matches as $match) {
                $logs[] = [
                    'timestamp' => $match[1],
                    'environment' => $match[2],
                    'level' => strtoupper($match[3]),
                    'message' => trim($match[4]),
                ];
            }

            // Sort by newest first
            $logs = array_reverse($logs);

            // Filter by level
            $levelFilter = $request->query('level');
            if ($levelFilter && $levelFilter !== 'ALL') {
                $logs = array_values(array_filter($logs, function ($log) use ($levelFilter) {
                    return $log['level'] === strtoupper($levelFilter);
                }));
            }

            // Filter by search
            $search = $request->query('search');
            if ($search) {
                $logs = array_values(array_filter($logs, function ($log) use ($search) {
                    return stripos($log['message'], $search) !== false;
                }));
            }

            // Paginate
            $limit = (int) $request->query('limit', 100);
            $logs = array_slice($logs, 0, $limit);

            return response()->json([
                'success' => true,
                'logs' => $logs
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to parse log file'], 500);
        }
    }

    // DELETE /api/system-logs
    public function clear()
    {
        $logPath = storage_path('logs/laravel.log');
        try {
            if (File::exists($logPath)) {
                File::put($logPath, ''); // Clear content
            }
            return response()->json([
                'success' => true,
                'message' => 'System logs cleared successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to clear system logs'], 500);
        }
    }

    // GET /api/system-logs/download
    public function download()
    {
        $logPath = storage_path('logs/laravel.log');
        if (!File::exists($logPath)) {
            abort(404, 'Log file is empty or does not exist');
        }

        return response()->download($logPath, 'laravel_system_log.txt');
    }
}

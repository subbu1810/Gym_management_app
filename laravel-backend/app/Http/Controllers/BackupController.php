<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class BackupController extends Controller
{
    private function getBackupDir()
    {
        $path = storage_path('app/backups');
        if (!File::exists($path)) {
            File::makeDirectory($path, 0755, true);
        }
        return $path;
    }

    // GET /api/backups
    public function index()
    {
        $backupDir = $this->getBackupDir();
        $files = File::files($backupDir);
        
        $backups = [];
        foreach ($files as $file) {
            if ($file->getExtension() === 'sqlite') {
                $backups[] = [
                    'filename' => $file->getFilename(),
                    'size' => $file->getSize(), // in bytes
                    'created_at' => date('Y-m-d H:i:s', $file->getMTime()),
                ];
            }
        }

        // Sort by newest first
        usort($backups, function ($a, $b) {
            return strcmp($b['created_at'], $a['created_at']);
        });

        return response()->json([
            'success' => true,
            'backups' => $backups
        ]);
    }

    // POST /api/backups
    public function create()
    {
        try {
            $dbPath = database_path('database.sqlite');
            if (!File::exists($dbPath)) {
                return response()->json(['success' => false, 'message' => 'Active SQLite database not found'], 404);
            }

            $backupDir = $this->getBackupDir();
            $filename = 'backup_' . date('Y-m-d_H-i-s') . '.sqlite';
            $destPath = $backupDir . '/' . $filename;

            File::copy($dbPath, $destPath);

            return response()->json([
                'success' => true,
                'message' => 'Database backup created successfully',
                'backup' => [
                    'filename' => $filename,
                    'size' => File::size($destPath),
                    'created_at' => date('Y-m-d H:i:s', File::lastModified($destPath))
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Backup creation failed: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to create database backup'], 500);
        }
    }

    // POST /api/backups/restore
    public function restore(Request $request)
    {
        $request->validate([
            'filename' => 'required|string'
        ]);

        $filename = $request->input('filename');
        // Prevent path traversal
        $filename = basename($filename);

        $backupDir = $this->getBackupDir();
        $backupPath = $backupDir . '/' . $filename;

        if (!File::exists($backupPath)) {
            return response()->json(['success' => false, 'message' => 'Backup file not found'], 404);
        }

        try {
            $dbPath = database_path('database.sqlite');
            
            // Backup the current db before overwriting just in case
            $safetyFilename = 'safety_' . date('Y-m-d_H-i-s') . '.sqlite';
            File::copy($dbPath, $backupDir . '/' . $safetyFilename);

            // Copy backup to active database
            File::copy($backupPath, $dbPath);

            return response()->json([
                'success' => true,
                'message' => 'Database restored successfully. Safety backup created: ' . $safetyFilename
            ]);
        } catch (\Exception $e) {
            \Log::error('Backup restore failed: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to restore database backup'], 500);
        }
    }

    // DELETE /api/backups/{filename}
    public function destroy($filename)
    {
        $filename = basename($filename);
        $backupDir = $this->getBackupDir();
        $backupPath = $backupDir . '/' . $filename;

        if (!File::exists($backupPath)) {
            return response()->json(['success' => false, 'message' => 'Backup file not found'], 404);
        }

        try {
            File::delete($backupPath);
            return response()->json([
                'success' => true,
                'message' => 'Backup file deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to delete backup file'], 500);
        }
    }

    // GET /api/backups/download/{filename}
    public function download($filename)
    {
        $filename = basename($filename);
        $backupDir = $this->getBackupDir();
        $backupPath = $backupDir . '/' . $filename;

        if (!File::exists($backupPath)) {
            abort(404, 'Backup file not found');
        }

        return response()->download($backupPath);
    }

    // POST /api/backups/upload
    public function upload(Request $request)
    {
        $request->validate([
            'backup_file' => 'required|file'
        ]);

        try {
            $file = $request->file('backup_file');
            
            // Check if extension is sqlite
            if ($file->getClientOriginalExtension() !== 'sqlite') {
                return response()->json(['success' => false, 'message' => 'Only .sqlite files are allowed'], 422);
            }

            $backupDir = $this->getBackupDir();
            $filename = 'uploaded_' . date('Y-m-d_H-i-s') . '_' . $file->getClientOriginalName();
            
            $file->move($backupDir, $filename);

            return response()->json([
                'success' => true,
                'message' => 'Backup file uploaded successfully',
                'backup' => [
                    'filename' => $filename,
                    'size' => File::size($backupDir . '/' . $filename),
                    'created_at' => date('Y-m-d H:i:s')
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Backup upload failed: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to upload backup file'], 500);
        }
    }
}

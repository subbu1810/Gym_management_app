<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? null;
        $role = $authUser['role'] ?? 'gym_admin';

        $query = DB::table('expenses');

        if ($role !== 'super_admin' && $gymId) {
            $query->where('gym_id', $gymId);
        }

        // Apply filters
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }
        if ($request->filled('date_from')) {
            $query->where('date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('date', '<=', $request->date_to);
        }
        if ($request->filled('search')) {
            $s = '%' . $request->search . '%';
            $query->where(function($q) use ($s) {
                $q->where('title', 'like', $s)
                  ->orWhere('description', 'like', $s);
            });
        }

        // Summaries
        $totalAmount = (clone $query)->sum('amount');

        $perPage = $request->get('per_page', 15);
        $records = $query->orderBy('date', 'desc')->orderBy('id', 'desc')->paginate($perPage);

        // Group by category summary
        $categoryQuery = DB::table('expenses');
        if ($role !== 'super_admin' && $gymId) {
            $categoryQuery->where('gym_id', $gymId);
        }
        if ($request->filled('date_from')) {
            $categoryQuery->where('date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $categoryQuery->where('date', '<=', $request->date_to);
        }
        if ($request->filled('search')) {
            $s = '%' . $request->search . '%';
            $categoryQuery->where(function($q) use ($s) {
                $q->where('title', 'like', $s)
                  ->orWhere('description', 'like', $s);
            });
        }
        $categoryStats = $categoryQuery->select('category', DB::raw('SUM(amount) as total'))->groupBy('category')->get();

        return response()->json([
            'success' => true,
            'data' => $records->items(),
            'total' => $records->total(),
            'lastPage' => $records->lastPage(),
            'currentPage' => $records->currentPage(),
            'total_amount' => (float)$totalAmount,
            'category_summary' => $categoryStats
        ]);
    }

    public function store(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? null;

        $request->validate([
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string',
            'date' => 'required|date',
            'payment_method' => 'required|string',
            'payment_status' => 'required|string',
            'paid_to' => 'nullable|string',
            'reference_no' => 'nullable|string',
            'description' => 'nullable|string',
            'is_recurring' => 'nullable',
            'receipt' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);

        $receiptPath = null;
        if ($request->hasFile('receipt')) {
            $path = $request->file('receipt')->store('receipts', 'public');
            $receiptPath = asset('storage/' . $path);
        }

        $expense = Expense::create([
            'gym_id' => $gymId ?? 1,
            'title' => $request->title,
            'amount' => $request->amount,
            'category' => $request->category,
            'date' => $request->date,
            'description' => $request->description,
            'payment_method' => $request->payment_method,
            'payment_status' => $request->payment_status,
            'paid_to' => $request->paid_to,
            'reference_no' => $request->reference_no,
            'receipt_path' => $receiptPath,
            'is_recurring' => filter_var($request->is_recurring, FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Expense recorded successfully',
            'data' => $expense
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string',
            'date' => 'required|date',
            'payment_method' => 'required|string',
            'payment_status' => 'required|string',
            'paid_to' => 'nullable|string',
            'reference_no' => 'nullable|string',
            'description' => 'nullable|string',
            'is_recurring' => 'nullable',
            'receipt' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);

        $expense = Expense::find($id);
        if (!$expense) {
            return response()->json([
                'success' => false,
                'message' => 'Expense not found'
            ], 404);
        }

        $data = $request->except(['receipt']);

        if ($request->hasFile('receipt')) {
            $path = $request->file('receipt')->store('receipts', 'public');
            $data['receipt_path'] = asset('storage/' . $path);
        }

        $data['is_recurring'] = filter_var($request->is_recurring, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;

        $expense->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Expense updated successfully',
            'data' => $expense
        ]);
    }

    public function destroy($id)
    {
        $expense = Expense::find($id);
        if (!$expense) {
            return response()->json([
                'success' => false,
                'message' => 'Expense not found'
            ], 404);
        }

        $expense->delete();

        return response()->json([
            'success' => true,
            'message' => 'Expense deleted successfully'
        ]);
    }
}

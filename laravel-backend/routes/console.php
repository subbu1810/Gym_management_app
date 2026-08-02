<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

Schedule::call(function () {
    // Find all expenses marked as recurring
    $recurringExpenses = DB::table('expenses')
        ->where('is_recurring', 1)
        ->get();

    $currentMonth = Carbon::now()->format('Y-m');

    foreach ($recurringExpenses as $expense) {
        // Check if this expense has already been processed for the current month
        $exists = DB::table('expenses')
            ->where('gym_id', $expense->gym_id)
            ->where('title', $expense->title)
            ->where('category', $expense->category)
            ->where('amount', $expense->amount)
            ->where('date', 'like', $currentMonth . '-%')
            ->exists();

        if (!$exists) {
            $originalDate = Carbon::parse($expense->date);
            // Match the day of the month
            $newDate = Carbon::now()->day($originalDate->day)->format('Y-m-d');

            DB::table('expenses')->insert([
                'gym_id'         => $expense->gym_id,
                'title'          => $expense->title,
                'amount'         => $expense->amount,
                'category'       => $expense->category,
                'date'           => $newDate,
                'description'    => $expense->description,
                'payment_method' => $expense->payment_method,
                'payment_status' => $expense->payment_status,
                'paid_to'        => $expense->paid_to,
                'reference_no'   => $expense->reference_no ? $expense->reference_no . '-REC' : null,
                'receipt_path'   => $expense->receipt_path,
                'is_recurring'   => 1,
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
        }
    }
})->daily();

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Gym;

class DummyPaymentsSeeder extends Seeder
{
    public function run(): void
    {
        $gym = Gym::first();
        if (!$gym) return;

        $users = User::where('gym_id', $gym->id)->take(20)->get();
        if ($users->isEmpty()) return;

        $statuses = ['Paid', 'Paid', 'Paid', 'Pending', 'Refunded'];
        
        foreach ($users as $user) {
            DB::table('payments')->insert([
                'gym_id' => $gym->id,
                'user_id' => $user->id,
                'amount' => rand(1500, 5000),
                'payment_status' => $statuses[array_rand($statuses)],
                'transaction_id' => 'TXN' . rand(100000, 999999),
                'created_at' => now()->subDays(rand(1, 30)),
                'updated_at' => now(),
            ]);
        }
    }
}

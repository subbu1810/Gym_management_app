<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Plan;
use App\Models\Gym;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $gym = Gym::first();

        if (!$gym) {
            $gym = Gym::create([
                'name' => 'Power Gym',
                'location' => 'Central',
                'description' => 'A powerful gym',
                'amenities' => 'Wifi',
                'status' => 'active'
            ]);
        }

        $plans = [
            [
                'gym_id' => $gym->id,
                'name' => 'Monthly Plan',
                'duration_months' => 1,
                'duration_days' => 30,
                'price' => 1500.00,
                'description' => 'Basic monthly subscription',
                'features' => ['Gym Access', 'Free Weights'],
                'is_active' => true,
                'color_theme' => 'blue',
            ],
            [
                'gym_id' => $gym->id,
                'name' => 'Quarterly Plan',
                'duration_months' => 3,
                'duration_days' => 90,
                'price' => 4000.00,
                'description' => '3 months subscription with discount',
                'features' => ['Gym Access', 'Free Weights', 'Cardio'],
                'is_active' => true,
                'color_theme' => 'green',
            ],
            [
                'gym_id' => $gym->id,
                'name' => 'Half-Yearly Plan',
                'duration_months' => 6,
                'duration_days' => 180,
                'price' => 7500.00,
                'description' => '6 months subscription',
                'features' => ['Gym Access', 'Cardio', 'Locker'],
                'is_active' => true,
                'color_theme' => 'orange',
            ],
            [
                'gym_id' => $gym->id,
                'name' => 'Yearly Plan',
                'duration_months' => 12,
                'duration_days' => 365,
                'price' => 12000.00,
                'description' => 'Annual subscription with all perks',
                'features' => ['Gym Access', 'Cardio', 'Locker', 'Personal Trainer 1 Session'],
                'is_active' => true,
                'color_theme' => 'purple',
            ],
        ];

        foreach ($plans as $plan) {
            Plan::create($plan);
        }
    }
}

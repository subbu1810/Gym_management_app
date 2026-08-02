<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Trainer;
use App\Models\Gym;

class TrainerSeeder extends Seeder
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

        $trainers = [
            [
                'gym_id' => $gym->id,
                'name' => 'John Doe',
                'specialty' => 'Bodybuilding & Powerlifting',
                'email' => 'john.doe@powergym.com',
                'phone' => '9876543210',
                'status' => 'active',
            ],
            [
                'gym_id' => $gym->id,
                'name' => 'Jane Smith',
                'specialty' => 'Yoga & Pilates',
                'email' => 'jane.smith@powergym.com',
                'phone' => '9876543211',
                'status' => 'active',
            ],
            [
                'gym_id' => $gym->id,
                'name' => 'Mike Johnson',
                'specialty' => 'Cardio & HIIT',
                'email' => 'mike.johnson@powergym.com',
                'phone' => '9876543212',
                'status' => 'active',
            ],
            [
                'gym_id' => $gym->id,
                'name' => 'Sarah Connor',
                'specialty' => 'CrossFit & Conditioning',
                'email' => 'sarah.connor@powergym.com',
                'phone' => '9876543213',
                'status' => 'inactive',
            ],
            [
                'gym_id' => $gym->id,
                'name' => 'David Lee',
                'specialty' => 'Calisthenics',
                'email' => 'david.lee@powergym.com',
                'phone' => '9876543214',
                'status' => 'active',
            ]
        ];

        foreach ($trainers as $trainer) {
            Trainer::create($trainer);
        }
    }
}

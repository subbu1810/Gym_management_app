<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;
use App\Models\User;
use App\Models\Gym;
use App\Models\Payment;
use Illuminate\Support\Facades\Hash;

class MemberSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();
        
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

        for ($i = 0; $i < 30; $i++) {
            $planTypes = ['Monthly Plan', '3 Months Plan', '6 Months Plan', 'Yearly Plan'];
            $statuses = ['Active', 'Pending', 'Expired', 'Trial', 'Paused'];
            $status = $faker->randomElement($statuses);

            // Create member
            $user = User::create([
                'gym_id' => $gym->id,
                'username' => $faker->unique()->userName,
                'password_hash' => Hash::make('password'),
                'firstName' => $faker->firstName,
                'lastName' => $faker->lastName,
                'full_name' => $faker->name,
                'email' => $faker->unique()->safeEmail,
                'phone' => $faker->phoneNumber,
                'gender' => $faker->randomElement(['Male', 'Female']),
                'address' => $faker->address,
                'status' => $status,
                'plan_type' => $faker->randomElement($planTypes),
                'join_date' => $faker->dateTimeBetween('-1 year', 'now')->format('Y-m-d'),
                'gym_slot' => $faker->randomElement(['Morning', 'Evening']),
            ]);

            // Create payment
            $paymentStatuses = ['Paid', 'Pending', 'Failed'];
            Payment::create([
                'gym_id' => $gym->id,
                'user_id' => $user->id,
                'amount' => $faker->randomElement([1500, 3000, 6000, 10000]),
                'payment_status' => $faker->randomElement($paymentStatuses),
                'currency' => 'INR',
                'transaction_id' => 'TXN' . strtoupper($faker->bothify('?????#####')),
            ]);
        }
    }
}

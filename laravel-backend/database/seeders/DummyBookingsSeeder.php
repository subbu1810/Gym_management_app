<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;
use App\Models\User;
use App\Models\Gym;
use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Support\Facades\Hash;

class DummyBookingsSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();
        
        // Ensure there is at least one gym
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

        for ($i = 0; $i < 100; $i++) {
            // Create user
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
            ]);

            // Create booking
            $planTypes = ['Monthly', '3 Months', '6 Months', 'Yearly'];
            $statuses = ['Pending', 'Confirmed', 'Cancelled'];
            
            $booking = Booking::create([
                'user_id' => $user->id,
                'gym_id' => $gym->id,
                'plan_type' => $faker->randomElement($planTypes),
                'booking_date' => $faker->dateTimeBetween('-1 month', 'now')->format('Y-m-d'),
                'gym_slot' => $faker->time('H:i'),
                'status' => $faker->randomElement($statuses),
                'terms_accepted' => true,
            ]);

            // Create payment
            $paymentStatuses = ['Pending', 'Paid', 'Refunded'];
            Payment::create([
                'gym_id' => $gym->id,
                'booking_id' => $booking->id,
                'amount' => $faker->randomFloat(2, 50, 500),
                'payment_status' => $faker->randomElement($paymentStatuses),
                'transaction_id' => 'TXN' . strtoupper($faker->bothify('?????#####')),
            ]);
        }
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $superAdminExists = DB::table('admins')->where('username', 'superadmin')->exists();

        if (!$superAdminExists) {
            DB::table('admins')->insert([
                'gym_id'        => null,
                'role'          => 'super_admin',
                'username'      => 'superadmin',
                'password_hash' => password_hash('password', PASSWORD_BCRYPT),
                'email'         => 'superadmin@example.com',
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);
            $this->command->info('Super Admin created: superadmin / password');
        }

        $gymExists = DB::table('gyms')->where('email', 'gym@example.com')->exists();

        if (!$gymExists) {
            $gymId = DB::table('gyms')->insertGetId([
                'name'                 => 'Elite Fitness',
                'email'                => 'gym@example.com',
                'phone'                => '1234567890',
                'address'              => '123 Fitness St',
                'subscription_status'  => 'active',
                'subscription_plan'    => 'premium',
                'subscription_ends_at' => now()->addYear(),
                'created_at'           => now(),
                'updated_at'           => now(),
            ]);

            DB::table('admins')->insert([
                'gym_id'        => $gymId,
                'role'          => 'gym_admin',
                'username'      => 'admin',
                'password_hash' => password_hash('password', PASSWORD_BCRYPT),
                'email'         => 'gym@example.com',
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);
            $this->command->info('Gym & Gym Admin created: admin / password');
        }
    }
}

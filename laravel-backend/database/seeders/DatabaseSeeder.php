<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(AdminSeeder::class);
        $this->call(PlanSeeder::class);
        $this->call(MemberSeeder::class);
        $this->call(TrainerSeeder::class);
    }
}

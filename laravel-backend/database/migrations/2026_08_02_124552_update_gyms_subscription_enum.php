<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE gyms MODIFY COLUMN subscription_status ENUM('active', 'inactive', 'suspended', 'trial', 'cancelled') DEFAULT 'trial'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE gyms MODIFY COLUMN subscription_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active'");
    }
};

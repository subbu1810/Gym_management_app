<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gyms', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            // SaaS Subscription fields
            $table->enum('subscription_status', ['active', 'inactive', 'suspended'])->default('active');
            $table->timestamp('subscription_ends_at')->nullable();
            $table->string('subscription_plan')->default('monthly'); // e.g., monthly, yearly
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gyms');
    }
};

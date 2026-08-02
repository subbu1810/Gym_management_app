<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('admins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gym_id')->nullable()->constrained('gyms')->onDelete('cascade');
            $table->enum('role', ['super_admin', 'gym_admin'])->default('gym_admin');
            $table->string('username', 100)->unique();
            $table->string('password_hash', 255);
            $table->string('email', 150)->nullable();
            $table->string('mobile_number', 50)->nullable();
            $table->string('reset_otp', 10)->nullable();
            $table->timestamp('reset_otp_expiry')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admins');
    }
};

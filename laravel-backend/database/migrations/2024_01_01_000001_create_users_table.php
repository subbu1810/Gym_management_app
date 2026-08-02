<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gym_id')->constrained('gyms')->onDelete('cascade');
            $table->string('username', 100)->unique();
            $table->string('password_hash', 255);
            $table->string('firstName', 100)->nullable();
            $table->string('lastName', 100)->nullable();
            $table->string('full_name', 200)->nullable();
            $table->string('email', 150)->unique()->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('dateOfBirth', 50)->nullable();
            $table->string('whatsappNumber', 50)->nullable();
            $table->string('gender', 20)->nullable();
            $table->string('age', 10)->nullable();
            $table->text('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 100)->nullable();
            $table->string('pincode', 20)->nullable();
            $table->string('emergencyContactName', 150)->nullable();
            $table->string('emergencyContactNumber', 50)->nullable();
            $table->string('occupation', 100)->nullable();
            $table->string('idProofType', 50)->nullable();
            $table->string('idProofNumber', 100)->nullable();
            $table->string('height', 20)->nullable();
            $table->string('weight', 20)->nullable();
            $table->string('bloodGroup', 10)->nullable();
            $table->string('medical_condition', 10)->nullable();
            $table->text('medical_details')->nullable();
            $table->longText('profilePhoto')->nullable();
            $table->longText('idProofPhoto')->nullable();
            
            // Booking/Subscription Fields
            $table->string('plan_type', 100)->nullable();
            $table->string('join_date', 50)->nullable();
            $table->string('gym_slot', 50)->nullable();
            $table->string('status', 50)->default('Pending');
            $table->string('referralCode', 50)->nullable();
            $table->boolean('terms_accepted')->default(false);

            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};

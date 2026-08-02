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
        Schema::table('attendances', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
            $table->unsignedBigInteger('gym_id')->nullable()->after('user_id');
            $table->string('method')->default('Manual')->after('check_out_time');
            $table->unsignedBigInteger('trainer_id')->nullable()->after('method');
            $table->string('branch_id')->nullable()->after('trainer_id');
            $table->string('status')->default('Present')->after('branch_id');
            
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('gym_id')->references('id')->on('gyms')->onDelete('cascade');
            $table->foreign('trainer_id')->references('id')->on('trainers')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['gym_id']);
            $table->dropForeign(['trainer_id']);
            $table->dropColumn(['user_id', 'gym_id', 'method', 'trainer_id', 'branch_id', 'status']);
        });
    }
};

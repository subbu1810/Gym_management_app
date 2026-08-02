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
        Schema::table('trainers', function (Blueprint $table) {
            // Personal
            $table->string('first_name')->nullable()->after('id');
            $table->string('last_name')->nullable()->after('first_name');
            $table->string('profile_photo')->nullable()->after('name');
            $table->string('gender')->nullable()->after('profile_photo');
            $table->date('dob')->nullable()->after('gender');
            $table->string('alternate_phone')->nullable()->after('phone');
            $table->text('address')->nullable()->after('alternate_phone');
            $table->string('city')->nullable()->after('address');
            $table->string('state')->nullable()->after('city');
            $table->string('country')->nullable()->after('state');
            $table->string('pincode')->nullable()->after('country');
            
            // Professional
            $table->json('specializations')->nullable()->after('specialty');
            $table->integer('experience_years')->nullable()->after('specializations');
            $table->string('qualification')->nullable()->after('experience_years');
            $table->json('certifications')->nullable()->after('qualification');
            $table->json('languages_known')->nullable()->after('certifications');
            $table->text('bio')->nullable()->after('languages_known');

            // Working Schedule
            $table->json('working_days')->nullable()->after('bio');
            $table->string('shift')->nullable()->after('working_days');
            $table->time('start_time')->nullable()->after('shift');
            $table->time('end_time')->nullable()->after('start_time');
            $table->string('weekly_off')->nullable()->after('end_time');
            $table->string('break_time')->nullable()->after('weekly_off');

            // Availability
            $table->boolean('available_for_pt')->default(false)->after('break_time');
            $table->integer('max_members_per_day')->nullable()->after('available_for_pt');
            $table->integer('max_sessions_per_day')->nullable()->after('max_members_per_day');
            $table->boolean('online_training_available')->default(false)->after('max_sessions_per_day');
            $table->boolean('home_visit_available')->default(false)->after('online_training_available');

            // Skills
            $table->json('skills')->nullable()->after('home_visit_available');

            // Login
            $table->string('username')->nullable()->after('email');
            $table->string('role')->default('trainer')->after('password_hash');
            $table->json('permissions')->nullable()->after('role');
            $table->timestamp('last_login')->nullable()->after('permissions');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trainers', function (Blueprint $table) {
            $table->dropColumn([
                'first_name', 'last_name', 'profile_photo', 'gender', 'dob', 'alternate_phone', 
                'address', 'city', 'state', 'country', 'pincode', 'specializations', 
                'experience_years', 'qualification', 'certifications', 'languages_known', 
                'bio', 'working_days', 'shift', 'start_time', 'end_time', 'weekly_off', 
                'break_time', 'available_for_pt', 'max_members_per_day', 'max_sessions_per_day', 
                'online_training_available', 'home_visit_available', 'skills', 'username', 
                'role', 'permissions', 'last_login'
            ]);
        });
    }
};

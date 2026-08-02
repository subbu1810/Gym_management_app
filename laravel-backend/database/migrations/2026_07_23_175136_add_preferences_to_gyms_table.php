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
        Schema::table('gyms', function (Blueprint $table) {
            $table->string('currency')->default('Indian Rupee (₹)');
            $table->string('date_format')->default('31 May 2024');
            $table->string('time_format')->default('12 Hour (AM/PM)');
            $table->string('timezone')->default('(GMT +05:30) Asia/Kolkata');
            $table->string('language')->default('English');
            $table->string('logo_path')->nullable();
            $table->json('notification_settings')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('gyms', function (Blueprint $table) {
            $table->dropColumn(['currency', 'date_format', 'time_format', 'timezone', 'language', 'logo_path', 'notification_settings']);
        });
    }
};

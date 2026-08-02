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
            $table->string('twilio_sid')->nullable();
            $table->string('twilio_auth_token')->nullable();
            $table->string('twilio_phone_number')->nullable();
            $table->boolean('enable_sms')->default(false);
            $table->boolean('enable_whatsapp')->default(false);
            $table->string('smtp_host')->nullable();
            $table->integer('smtp_port')->nullable();
            $table->string('smtp_username')->nullable();
            $table->string('smtp_password')->nullable();
            $table->string('smtp_sender_email')->nullable();
            $table->string('smtp_sender_name')->nullable();
            $table->string('smtp_encryption')->default('tls');
            $table->boolean('enable_smtp')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('gyms', function (Blueprint $table) {
            $table->dropColumn([
                'twilio_sid', 'twilio_auth_token', 'twilio_phone_number', 'enable_sms', 'enable_whatsapp',
                'smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_sender_email',
                'smtp_sender_name', 'smtp_encryption', 'enable_smtp'
            ]);
        });
    }
};

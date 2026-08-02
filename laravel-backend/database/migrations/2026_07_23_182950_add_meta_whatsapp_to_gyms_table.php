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
            $table->string('whatsapp_access_token')->nullable();
            $table->string('whatsapp_phone_number_id')->nullable();
            $table->string('whatsapp_business_account_id')->nullable();
            $table->boolean('enable_whatsapp_meta')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('gyms', function (Blueprint $table) {
            $table->dropColumn([
                'whatsapp_access_token', 'whatsapp_phone_number_id',
                'whatsapp_business_account_id', 'enable_whatsapp_meta'
            ]);
        });
    }
};

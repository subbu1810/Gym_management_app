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
            $table->boolean('whatsapp_notify_new_customer')->default(false);
            $table->boolean('whatsapp_notify_payment_updated')->default(false);
            $table->boolean('whatsapp_notify_plan_expiring')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gyms', function (Blueprint $table) {
            $table->dropColumn([
                'whatsapp_notify_new_customer',
                'whatsapp_notify_payment_updated',
                'whatsapp_notify_plan_expiring'
            ]);
        });
    }
};

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
            $table->string('razorpay_key_id')->nullable();
            $table->string('razorpay_key_secret')->nullable();
            $table->boolean('enable_online_payment')->default(true);
            $table->boolean('enable_cash')->default(true);
            $table->boolean('enable_upi')->default(true);
            $table->boolean('enable_bank_transfer')->default(true);
            $table->boolean('enable_card')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('gyms', function (Blueprint $table) {
            $table->dropColumn([
                'razorpay_key_id', 'razorpay_key_secret', 'enable_online_payment',
                'enable_cash', 'enable_upi', 'enable_bank_transfer', 'enable_card'
            ]);
        });
    }
};

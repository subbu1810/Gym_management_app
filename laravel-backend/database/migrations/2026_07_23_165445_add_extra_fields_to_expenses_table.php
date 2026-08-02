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
        Schema::table('expenses', function (Blueprint $table) {
            $table->string('payment_method')->default('Cash');
            $table->string('paid_to')->nullable();
            $table->string('reference_no')->nullable();
            $table->string('receipt_path')->nullable();
            $table->boolean('is_recurring')->default(false);
            $table->string('payment_status')->default('Paid');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'paid_to', 'reference_no', 'receipt_path', 'is_recurring', 'payment_status']);
        });
    }
};

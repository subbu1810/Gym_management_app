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
            $table->string('tax_name')->default('GST');
            $table->decimal('tax_rate', 5, 2)->default(0.00);
            $table->string('tax_registration_no')->nullable();
            $table->string('tax_calculation_type')->default('exclusive'); // inclusive or exclusive
            $table->boolean('enable_tax')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('gyms', function (Blueprint $table) {
            $table->dropColumn(['tax_name', 'tax_rate', 'tax_registration_no', 'tax_calculation_type', 'enable_tax']);
        });
    }
};

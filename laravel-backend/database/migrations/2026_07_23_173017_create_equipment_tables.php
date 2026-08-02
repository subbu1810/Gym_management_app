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
        Schema::create('equipment_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('status', 20)->default('active'); // active, inactive
            $table->timestamps();
        });

        Schema::create('equipment_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gym_id')->default(1)->constrained('gyms')->onDelete('cascade');
            $table->string('asset_code')->unique();
            $table->string('name');
            $table->foreignId('category_id')->constrained('equipment_categories')->onDelete('cascade');
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->integer('quantity')->default(1);
            $table->text('description')->nullable();
            $table->date('purchase_date')->nullable();
            $table->decimal('purchase_price', 10, 2)->default(0.00);
            $table->boolean('is_price_per_unit')->default(true);
            $table->string('supplier')->nullable();
            $table->string('invoice_no')->nullable();
            $table->string('invoice_path')->nullable();
            $table->boolean('warranty_available')->default(false);
            $table->date('warranty_start_date')->nullable();
            $table->date('warranty_end_date')->nullable();
            $table->string('warranty_provider')->nullable();
            $table->text('warranty_notes')->nullable();
            $table->string('branch');
            $table->string('floor')->nullable();
            $table->string('area')->nullable(); // Cardio Zone, Strength Zone, Free Weight Area, Functional Training Area, Reception, Locker Room, Other
            $table->string('status', 30)->default('Working'); // Working, Under Maintenance, Out of Service, Retired
            $table->string('condition', 20)->default('Good'); // Excellent, Good, Fair, Poor
            $table->foreignId('parent_id')->nullable()->constrained('equipment_items')->onDelete('cascade');
            $table->string('serial_number')->nullable();
            $table->timestamps();
        });

        Schema::create('equipment_maintenance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gym_id')->default(1)->constrained('gyms')->onDelete('cascade');
            $table->foreignId('equipment_id')->constrained('equipment_items')->onDelete('cascade');
            $table->string('type', 40); // Preventive Maintenance, Regular Service, Repair, Breakdown, Inspection, Parts Replacement
            $table->date('date');
            $table->string('technician')->nullable();
            $table->decimal('cost', 10, 2)->default(0.00);
            $table->text('description')->nullable();
            $table->string('parts_replaced')->nullable();
            $table->date('next_date')->nullable();
            $table->string('bill_path')->nullable();
            $table->text('notes')->nullable();
            $table->string('frequency', 20)->default('One Time'); // One Time, Monthly, Every 3 Months, Every 6 Months, Yearly
            $table->string('status', 20)->default('Upcoming'); // Upcoming, Due Today, Overdue, Completed
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipment_maintenance');
        Schema::dropIfExists('equipment_items');
        Schema::dropIfExists('equipment_categories');
    }
};

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
        Schema::create('inventory_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('status', 20)->default('active'); // active, inactive
            $table->timestamps();
        });

        Schema::create('inventory_suppliers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gym_id')->default(1)->constrained('gyms')->onDelete('cascade');
            $table->string('name');
            $table->string('contact_person')->nullable();
            $table->string('phone');
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->string('gst_number')->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('active'); // active, inactive
            $table->timestamps();
        });

        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gym_id')->default(1)->constrained('gyms')->onDelete('cascade');
            $table->string('sku')->unique();
            $table->string('name');
            $table->foreignId('category_id')->constrained('inventory_categories')->onDelete('cascade');
            $table->string('brand')->nullable();
            $table->text('description')->nullable();
            $table->string('image_path')->nullable();
            $table->integer('opening_stock')->default(0);
            $table->integer('current_stock')->default(0);
            $table->string('unit', 20)->default('Piece'); // Piece, Box, Bottle, Pack, KG, Litre
            $table->integer('reorder_level')->default(5);
            $table->decimal('purchase_price', 10, 2)->default(0.00);
            $table->decimal('selling_price', 10, 2)->nullable();
            $table->decimal('tax_percent', 5, 2)->default(0.00);
            $table->foreignId('supplier_id')->nullable()->constrained('inventory_suppliers')->onDelete('set null');
            $table->date('purchase_date')->nullable();
            $table->string('batch_number')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('location')->nullable();
            $table->string('branch')->nullable();
            $table->timestamps();
        });

        Schema::create('inventory_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gym_id')->default(1)->constrained('gyms')->onDelete('cascade');
            $table->foreignId('item_id')->constrained('inventory_items')->onDelete('cascade');
            $table->string('type', 20); // Stock In, Stock Out
            $table->integer('quantity');
            $table->integer('prev_stock');
            $table->integer('new_stock');
            $table->string('reason'); // Purchase, Customer Return, Damage, Expiry, Lost, Sold, etc.
            $table->string('reference')->nullable(); // Reference/Bill/Transaction No.
            $table->foreignId('supplier_id')->nullable()->constrained('inventory_suppliers')->onDelete('set null');
            $table->date('date');
            $table->text('notes')->nullable();
            $table->string('receipt_path')->nullable();
            $table->string('created_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_history');
        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('inventory_suppliers');
        Schema::dropIfExists('inventory_categories');
    }
};

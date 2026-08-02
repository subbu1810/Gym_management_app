<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('gym_id')->nullable();
            $table->string('name');
            $table->integer('duration_months')->nullable();
            $table->integer('duration_days')->nullable();
            $table->decimal('price', 10, 2);
            $table->text('description')->nullable();
            $table->json('features')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('color_theme')->nullable()->default('green');
            $table->timestamps();

            $table->foreign('gym_id')->references('id')->on('gyms')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'gym_id',
        'name',
        'duration_months',
        'duration_days',
        'price',
        'description',
        'features',
        'is_active',
        'color_theme'
    ];

    protected $casts = [
        'features' => 'array',
        'is_active' => 'boolean',
    ];
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Trainer extends Model
{
    use HasFactory;
    protected $guarded = [];

    protected $casts = [
        'specializations' => 'array',
        'certifications' => 'array',
        'languages_known' => 'array',
        'working_days' => 'array',
        'skills' => 'array',
        'permissions' => 'array',
        'available_for_pt' => 'boolean',
        'online_training_available' => 'boolean',
        'home_visit_available' => 'boolean',
        'dob' => 'date',
        'last_login' => 'datetime',
    ];
    public function gym()
    {
        return $this->belongsTo(Gym::class);
    }
}

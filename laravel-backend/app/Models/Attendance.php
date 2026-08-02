<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class Attendance extends Model
{
    use HasFactory;
    protected $guarded = [];

    public function user()
    {
        return $this->belongsTo(GymUser::class, 'user_id', 'id');
    }

    public function gym()
    {
        return $this->belongsTo(Gym::class);
    }

    public function trainer()
    {
        return $this->belongsTo(Trainer::class);
    }
}

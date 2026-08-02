<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $table = 'bookings';

    protected $fillable = [
        'gym_id', 'user_id', 'plan_type', 'booking_date', 'gym_slot',
        'status', 'referralCode', 'terms_accepted',
    ];

    protected $casts = [
        'terms_accepted' => 'boolean',
    ];

    public function gym()
    {
        return $this->belongsTo(Gym::class);
    }

    public function user()
    {
        return $this->belongsTo(GymUser::class, 'user_id');
    }

    public function payment()
    {
        return $this->hasOne(Payment::class, 'booking_id');
    }
}

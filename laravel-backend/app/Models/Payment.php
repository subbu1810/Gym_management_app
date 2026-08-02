<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $table = 'payments';

    protected $fillable = [
        'gym_id', 'user_id', 'booking_id', 'amount', 'payment_status', 'currency', 'transaction_id',
    ];

    public function gym()
    {
        return $this->belongsTo(Gym::class);
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }
}

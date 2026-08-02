<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Admin extends Model
{
    protected $table = 'admins';

    protected $fillable = [
        'gym_id', 'role', 'username', 'password_hash', 'email', 'mobile_number',
        'reset_otp', 'reset_otp_expiry',
    ];

    protected $hidden = ['password_hash'];

    public function gym()
    {
        return $this->belongsTo(Gym::class);
    }
}

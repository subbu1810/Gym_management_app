<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GymUser extends Model
{
    protected $table = 'users';

    protected $fillable = [
        'gym_id', 'trainer_id', 'username', 'password_hash',
        'firstName', 'lastName', 'full_name', 'email', 'phone',
        'dateOfBirth', 'whatsappNumber', 'gender', 'age', 'address',
        'city', 'state', 'pincode', 'emergencyContactName', 'emergencyContactNumber',
        'occupation', 'idProofType', 'idProofNumber', 'height', 'weight',
        'bloodGroup', 'medical_condition', 'medical_details', 'profilePhoto', 'idProofPhoto',
        'plan_type', 'join_date', 'gym_slot', 'status', 'referralCode', 'terms_accepted'
    ];

    protected $hidden = ['password_hash'];

    public function gym()
    {
        return $this->belongsTo(Gym::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'user_id');
    }

    public function trainer()
    {
        return $this->belongsTo(Trainer::class, 'trainer_id');
    }
}

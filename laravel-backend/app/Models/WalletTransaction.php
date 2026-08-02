<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WalletTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'gym_id',
        'type',
        'amount',
        'balance_after',
        'description',
        'reference_id'
    ];

    public function gym()
    {
        return $this->belongsTo(Gym::class);
    }
}

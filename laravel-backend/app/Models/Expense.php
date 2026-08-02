<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Expense extends Model
{
    use HasFactory;

    protected $table = 'expenses';

    protected $fillable = [
        'gym_id', 'title', 'amount', 'category', 'date', 'description',
        'payment_method', 'paid_to', 'reference_no', 'receipt_path', 'is_recurring', 'payment_status'
    ];

    public function gym()
    {
        return $this->belongsTo(Gym::class);
    }
}

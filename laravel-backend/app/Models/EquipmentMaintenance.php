<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EquipmentMaintenance extends Model
{
    use HasFactory;

    protected $table = 'equipment_maintenance';

    protected $fillable = [
        'gym_id', 'equipment_id', 'type', 'date', 'technician', 'cost', 'description',
        'parts_replaced', 'next_date', 'bill_path', 'notes', 'frequency', 'status'
    ];

    public function equipment()
    {
        return $this->belongsTo(EquipmentItem::class, 'equipment_id');
    }
}

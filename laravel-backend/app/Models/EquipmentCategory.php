<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EquipmentCategory extends Model
{
    use HasFactory;

    protected $table = 'equipment_categories';

    protected $fillable = ['name', 'status'];

    public function items()
    {
        return $this->hasMany(EquipmentItem::class, 'category_id');
    }
}

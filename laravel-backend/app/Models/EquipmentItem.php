<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EquipmentItem extends Model
{
    use HasFactory;

    protected $table = 'equipment_items';

    protected $fillable = [
        'gym_id', 'asset_code', 'name', 'category_id', 'brand', 'model', 'quantity', 'description',
        'purchase_date', 'purchase_price', 'is_price_per_unit', 'supplier', 'invoice_no', 'invoice_path',
        'warranty_available', 'warranty_start_date', 'warranty_end_date', 'warranty_provider', 'warranty_notes',
        'branch', 'floor', 'area', 'status', 'condition', 'parent_id', 'serial_number'
    ];

    public function category()
    {
        return $this->belongsTo(EquipmentCategory::class, 'category_id');
    }

    public function maintenanceLogs()
    {
        return $this->hasMany(EquipmentMaintenance::class, 'equipment_id');
    }

    public function parent()
    {
        return $this->belongsTo(EquipmentItem::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(EquipmentItem::class, 'parent_id');
    }
}

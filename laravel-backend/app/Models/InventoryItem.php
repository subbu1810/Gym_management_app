<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class InventoryItem extends Model
{
    use HasFactory;

    protected $table = 'inventory_items';

    protected $fillable = [
        'gym_id', 'sku', 'name', 'category_id', 'brand', 'description', 'image_path',
        'opening_stock', 'current_stock', 'unit', 'reorder_level',
        'purchase_price', 'selling_price', 'tax_percent', 'supplier_id',
        'purchase_date', 'batch_number', 'expiry_date', 'location', 'branch'
    ];

    public function category()
    {
        return $this->belongsTo(InventoryCategory::class, 'category_id');
    }

    public function supplier()
    {
        return $this->belongsTo(InventorySupplier::class, 'supplier_id');
    }

    public function histories()
    {
        return $this->hasMany(InventoryHistory::class, 'item_id');
    }
}

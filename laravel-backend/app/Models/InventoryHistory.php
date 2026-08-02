<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class InventoryHistory extends Model
{
    use HasFactory;

    protected $table = 'inventory_history';

    protected $fillable = [
        'gym_id', 'item_id', 'type', 'quantity', 'prev_stock', 'new_stock',
        'reason', 'reference', 'supplier_id', 'date', 'notes', 'receipt_path', 'created_by'
    ];

    public function item()
    {
        return $this->belongsTo(InventoryItem::class, 'item_id');
    }

    public function supplier()
    {
        return $this->belongsTo(InventorySupplier::class, 'supplier_id');
    }
}

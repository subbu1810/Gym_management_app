<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class InventorySupplier extends Model
{
    use HasFactory;

    protected $table = 'inventory_suppliers';

    protected $fillable = [
        'gym_id', 'name', 'contact_person', 'phone', 'email', 'address', 'gst_number', 'notes', 'status'
    ];

    public function items()
    {
        return $this->hasMany(InventoryItem::class, 'supplier_id');
    }
}

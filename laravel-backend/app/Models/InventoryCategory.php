<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class InventoryCategory extends Model
{
    use HasFactory;

    protected $table = 'inventory_categories';

    protected $fillable = ['name', 'status'];

    public function items()
    {
        return $this->hasMany(InventoryItem::class, 'category_id');
    }
}

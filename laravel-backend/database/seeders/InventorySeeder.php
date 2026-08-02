<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InventorySeeder extends Seeder
{
    public function run()
    {
        // 1. Seed Categories if not present
        $categories = [
            ['name' => 'Supplements', 'status' => 'active', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['name' => 'Beverages', 'status' => 'active', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['name' => 'Apparel', 'status' => 'active', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['name' => 'Accessories', 'status' => 'active', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()]
        ];

        foreach ($categories as $cat) {
            DB::table('inventory_categories')->insertOrIgnore($cat);
        }

        $cats = DB::table('inventory_categories')->pluck('id', 'name');

        // 2. Seed Suppliers
        $suppliers = [
            [
                'gym_id' => 1,
                'name' => 'Optimum Health Distributors',
                'contact_person' => 'Amit Sharma',
                'phone' => '9876543210',
                'email' => 'sales@optimumhealth.in',
                'address' => 'A-10, Phase 2, Okhla Industrial Area, New Delhi',
                'gst_number' => '07AAAAA1111A1Z1',
                'status' => 'active',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'gym_id' => 1,
                'name' => 'FitGear Wholesale',
                'contact_person' => 'Rajesh Patel',
                'phone' => '9988776655',
                'email' => 'info@fitgear.co.in',
                'address' => 'G-5, Sector 4, Noida, UP',
                'gst_number' => '09BBBBB2222B2Z2',
                'status' => 'active',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]
        ];

        foreach ($suppliers as $sup) {
            DB::table('inventory_suppliers')->insertOrIgnore($sup);
        }

        $sups = DB::table('inventory_suppliers')->pluck('id', 'name');

        // 3. Seed Items
        $items = [
            [
                'gym_id' => 1,
                'sku' => 'SUP-WHEY-01',
                'name' => 'Gold Standard Whey 1KG',
                'category_id' => $cats['Supplements'] ?? 1,
                'brand' => 'Optimum Nutrition',
                'description' => 'Double Rich Chocolate flavor whey protein isolate',
                'current_stock' => 12,
                'reorder_level' => 5,
                'unit' => 'Pcs',
                'purchase_price' => 2800.00,
                'selling_price' => 3800.00,
                'tax_percent' => 18,
                'supplier_id' => $sups['Optimum Health Distributors'] ?? 1,
                'purchase_date' => '2026-06-10',
                'batch_number' => 'BATCH-W-991',
                'expiry_date' => '2027-06-10',
                'location' => 'Shelf A',
                'branch' => 'Main Branch',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'gym_id' => 1,
                'sku' => 'BEV-DRINK-02',
                'name' => 'Monster Energy 350ML',
                'category_id' => $cats['Beverages'] ?? 2,
                'brand' => 'Monster',
                'description' => 'Carbonated energy drink cans',
                'current_stock' => 2, // low stock!
                'reorder_level' => 10,
                'unit' => 'Pcs',
                'purchase_price' => 90.00,
                'selling_price' => 120.00,
                'tax_percent' => 18,
                'supplier_id' => $sups['Optimum Health Distributors'] ?? 1,
                'purchase_date' => '2026-07-01',
                'batch_number' => 'BATCH-M-22',
                'expiry_date' => '2026-08-23', // expiring soon!
                'location' => 'Fridge',
                'branch' => 'Main Branch',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'gym_id' => 1,
                'sku' => 'ACC-SHAKE-03',
                'name' => 'Smart Shaker Pro 700ML',
                'category_id' => $cats['Accessories'] ?? 4,
                'brand' => 'FitGear',
                'description' => 'Leak-proof shaker bottle with supplement storage compartments',
                'current_stock' => 0, // out of stock!
                'reorder_level' => 3,
                'unit' => 'Pcs',
                'purchase_price' => 150.00,
                'selling_price' => 300.00,
                'tax_percent' => 12,
                'supplier_id' => $sups['FitGear Wholesale'] ?? 2,
                'purchase_date' => '2026-04-15',
                'batch_number' => 'BATCH-S-44',
                'expiry_date' => null,
                'location' => 'Cabinet B',
                'branch' => 'Main Branch',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'gym_id' => 1,
                'sku' => 'APP-TSHIRT-04',
                'name' => 'Dry-Fit Workout Tee (Black - L)',
                'category_id' => $cats['Apparel'] ?? 3,
                'brand' => 'FitGear',
                'description' => 'Premium stretch breathable dry-fit gym t-shirt',
                'current_stock' => 15,
                'reorder_level' => 4,
                'unit' => 'Pcs',
                'purchase_price' => 350.00,
                'selling_price' => 699.00,
                'tax_percent' => 5,
                'supplier_id' => $sups['FitGear Wholesale'] ?? 2,
                'purchase_date' => '2026-05-20',
                'batch_number' => 'BATCH-T-12',
                'expiry_date' => null,
                'location' => 'Apparel Rack',
                'branch' => 'Main Branch',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]
        ];

        foreach ($items as $item) {
            DB::table('inventory_items')->insertOrIgnore($item);
        }

        // Get created item IDs
        $dbItems = DB::table('inventory_items')->pluck('id', 'sku');

        // 4. Seed Stock History Logs (Purchases / Sales)
        $history = [
            [
                'gym_id' => 1,
                'item_id' => $dbItems['SUP-WHEY-01'] ?? 1,
                'type' => 'Stock In',
                'quantity' => 12,
                'prev_stock' => 0,
                'new_stock' => 12,
                'reason' => 'Purchase',
                'reference' => 'PO-09922',
                'date' => '2026-06-10',
                'notes' => 'Opening batch purchase',
                'created_by' => 'Admin',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'gym_id' => 1,
                'item_id' => $dbItems['BEV-DRINK-02'] ?? 2,
                'type' => 'Stock In',
                'quantity' => 10,
                'prev_stock' => 0,
                'new_stock' => 10,
                'reason' => 'Purchase',
                'reference' => 'PO-09944',
                'date' => '2026-07-01',
                'notes' => 'Fridge restocking',
                'created_by' => 'Admin',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            // Sales transactions (Stock Out reason = Sold)
            [
                'gym_id' => 1,
                'item_id' => $dbItems['BEV-DRINK-02'] ?? 2,
                'type' => 'Stock Out',
                'quantity' => 5,
                'prev_stock' => 10,
                'new_stock' => 5,
                'reason' => 'Sold',
                'reference' => 'SALE-Monster-01',
                'date' => '2026-07-15',
                'notes' => 'Sold to guest member',
                'created_by' => 'Admin',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'gym_id' => 1,
                'item_id' => $dbItems['BEV-DRINK-02'] ?? 2,
                'type' => 'Stock Out',
                'quantity' => 3,
                'prev_stock' => 5,
                'new_stock' => 2,
                'reason' => 'Sold',
                'reference' => 'SALE-Monster-02',
                'date' => '2026-07-20',
                'notes' => 'Post workout purchase',
                'created_by' => 'Admin',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'gym_id' => 1,
                'item_id' => $dbItems['APP-TSHIRT-04'] ?? 4,
                'type' => 'Stock Out',
                'quantity' => 2,
                'prev_stock' => 17,
                'new_stock' => 15,
                'reason' => 'Sold',
                'reference' => 'SALE-Tee-01',
                'date' => '2026-07-18',
                'notes' => 'Dry fit apparel sale',
                'created_by' => 'Admin',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]
        ];

        foreach ($history as $h) {
            DB::table('inventory_history')->insert($h);
        }
    }
}

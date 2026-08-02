<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\EquipmentCategory;
use App\Models\EquipmentItem;
use App\Models\EquipmentMaintenance;
use Carbon\Carbon;

class EquipmentSeeder extends Seeder
{
    public function run()
    {
        // 1. Ensure categories are present
        $categories = [
            'Cardio' => 'active',
            'Strength Training' => 'active',
            'Free Weights' => 'active',
            'Functional Training' => 'active',
            'Accessories' => 'active',
            'Recovery Equipment' => 'active',
            'Other' => 'active'
        ];

        $catModels = [];
        foreach ($categories as $name => $status) {
            $catModels[$name] = EquipmentCategory::firstOrCreate(
                ['name' => $name],
                ['status' => $status]
            );
        }

        // 2. Dummy Equipment items
        $eq1 = EquipmentItem::create([
            'gym_id' => 1,
            'asset_code' => 'EQ-TR-101',
            'name' => 'PowerMax Commercial Treadmill',
            'category_id' => $catModels['Cardio']->id,
            'brand' => 'PowerMax',
            'model' => 'TDA-500',
            'quantity' => 1,
            'description' => 'Premium high-end motor commercial treadmill',
            'purchase_date' => '2025-10-12',
            'purchase_price' => 75000.00,
            'is_price_per_unit' => true,
            'supplier' => 'Fit India Suppliers',
            'invoice_no' => 'INV-2025-9988',
            'warranty_available' => true,
            'warranty_start_date' => '2025-10-12',
            'warranty_end_date' => '2028-10-12',
            'warranty_provider' => 'PowerMax India',
            'warranty_notes' => '3 Year Frame & Motor Warranty',
            'branch' => 'Main Branch',
            'floor' => '1st Floor',
            'area' => 'Cardio Zone',
            'status' => 'Working',
            'condition' => 'Excellent'
        ]);

        // Add service history to Treadmill
        EquipmentMaintenance::create([
            'gym_id' => 1,
            'equipment_id' => $eq1->id,
            'type' => 'Regular Service',
            'date' => '2026-04-10',
            'technician' => 'Ramesh Kumar (FitService)',
            'cost' => 1500.00,
            'description' => 'Lubrication, belt tension alignment and motor dusting.',
            'parts_replaced' => 'Belt Lubricant',
            'next_date' => '2026-10-10',
            'frequency' => 'Every 6 Months',
            'status' => 'Completed'
        ]);

        // Add upcoming scheduled maintenance to Treadmill
        EquipmentMaintenance::create([
            'gym_id' => 1,
            'equipment_id' => $eq1->id,
            'type' => 'Preventive Maintenance',
            'date' => Carbon::today()->addDays(5)->toDateString(),
            'technician' => 'Ramesh Kumar',
            'cost' => 0.00,
            'description' => 'Next regular calibration check.',
            'next_date' => Carbon::today()->addMonths(6)->toDateString(),
            'frequency' => 'Every 6 Months',
            'status' => 'Upcoming'
        ]);

        $eq2 = EquipmentItem::create([
            'gym_id' => 1,
            'asset_code' => 'EQ-ST-202',
            'name' => 'Chest Press Machine',
            'category_id' => $catModels['Strength Training']->id,
            'brand' => 'Jerai Fitness',
            'model' => 'XP-CHEST',
            'quantity' => 1,
            'description' => 'Heavy duty pin-loaded chest selectorized machine',
            'purchase_date' => '2025-05-20',
            'purchase_price' => 52000.00,
            'is_price_per_unit' => true,
            'supplier' => 'Jerai Fitness Dist',
            'invoice_no' => 'INV-J-7711',
            'warranty_available' => true,
            'warranty_start_date' => '2025-05-20',
            'warranty_end_date' => '2026-05-20',
            'warranty_provider' => 'Jerai Care',
            'branch' => 'Main Branch',
            'floor' => 'Ground Floor',
            'area' => 'Strength Zone',
            'status' => 'Under Maintenance',
            'condition' => 'Fair'
        ]);

        EquipmentMaintenance::create([
            'gym_id' => 1,
            'equipment_id' => $eq2->id,
            'type' => 'Repair',
            'date' => Carbon::today()->toDateString(),
            'technician' => 'Jerai Engineer',
            'cost' => 4500.00,
            'description' => 'Pulley wire snap repair and replacement.',
            'parts_replaced' => 'High-tension Steel Cable Wire',
            'status' => 'Upcoming'
        ]);

        EquipmentItem::create([
            'gym_id' => 1,
            'asset_code' => 'EQ-FW-303',
            'name' => 'Hex Dumbbell Set (10 pairs)',
            'category_id' => $catModels['Free Weights']->id,
            'brand' => 'PowerGym',
            'model' => 'HEX-10',
            'quantity' => 20,
            'description' => 'Rubber coated hex dumbbells ranging 5kg to 25kg',
            'purchase_date' => '2026-02-15',
            'purchase_price' => 12000.00,
            'is_price_per_unit' => false, // total price
            'supplier' => 'Decathlon Commercial',
            'invoice_no' => 'DEC-90998',
            'warranty_available' => false,
            'branch' => 'Main Branch',
            'floor' => 'Ground Floor',
            'area' => 'Free Weight Area',
            'status' => 'Working',
            'condition' => 'Good'
        ]);

        EquipmentItem::create([
            'gym_id' => 1,
            'asset_code' => 'EQ-CB-404',
            'name' => 'Commercial Spin Bike',
            'category_id' => $catModels['Cardio']->id,
            'brand' => 'Fitline',
            'model' => 'SPIN-500',
            'quantity' => 1,
            'description' => 'Magnetic resistance flywheel stationary spin bike',
            'purchase_date' => '2024-03-10',
            'purchase_price' => 24000.00,
            'is_price_per_unit' => true,
            'supplier' => 'Fitline Direct',
            'invoice_no' => 'INV-FL-222',
            'warranty_available' => true,
            'warranty_start_date' => '2024-03-10',
            'warranty_end_date' => '2025-03-10',
            'warranty_provider' => 'Fitline Service',
            'branch' => 'Main Branch',
            'floor' => '1st Floor',
            'area' => 'Cardio Zone',
            'status' => 'Out of Service',
            'condition' => 'Poor'
        ]);
    }
}

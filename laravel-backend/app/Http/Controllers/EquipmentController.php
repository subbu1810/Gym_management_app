<?php

namespace App\Http\Controllers;

use App\Models\EquipmentCategory;
use App\Models\EquipmentItem;
use App\Models\EquipmentMaintenance;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class EquipmentController extends Controller
{
    private function autoSeedCategories()
    {
        if (EquipmentCategory::count() === 0) {
            $defaults = [
                'Cardio', 'Strength Training', 'Free Weights',
                'Functional Training', 'Accessories', 'Recovery Equipment', 'Other'
            ];
            foreach ($defaults as $name) {
                EquipmentCategory::create(['name' => $name, 'status' => 'active']);
            }
        }
    }

    public function getDashboard(Request $request)
    {
        $this->autoSeedCategories();
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $items = EquipmentItem::where('gym_id', $gymId)->get();

        $totalCount = 0;
        $workingCount = 0;
        $maintenanceCount = 0;
        $outOfServiceCount = 0;
        $dueCount = 0;

        $today = Carbon::today();
        $alerts = [];

        foreach ($items as $item) {
            // Aggregate quantity sum
            $qty = (int)$item->quantity;
            $totalCount += $qty;

            if ($item->status === 'Working') {
                $workingCount += $qty;
            } elseif ($item->status === 'Under Maintenance') {
                $maintenanceCount += $qty;
            } elseif ($item->status === 'Out of Service') {
                $outOfServiceCount += $qty;
            }

            // Check next maintenance due date
            $upcomingMaintenance = EquipmentMaintenance::where('equipment_id', $item->id)
                ->where('status', '!=', 'Completed')
                ->orderBy('date', 'asc')
                ->first();

            if ($upcomingMaintenance) {
                $dueDate = Carbon::parse($upcomingMaintenance->date);
                if ($dueDate->isPast() || $dueDate->isToday()) {
                    $dueCount += $qty;
                    $alerts[] = [
                        'equipment_id' => $item->id,
                        'name' => $item->name,
                        'asset_code' => $item->asset_code,
                        'due_date' => $upcomingMaintenance->date,
                        'status' => $dueDate->isPast() ? 'Overdue' : 'Due Today'
                    ];
                } elseif ($dueDate->diffInDays($today) <= 7) {
                    $dueCount += $qty;
                    $alerts[] = [
                        'equipment_id' => $item->id,
                        'name' => $item->name,
                        'asset_code' => $item->asset_code,
                        'due_date' => $upcomingMaintenance->date,
                        'status' => 'Upcoming (' . $dueDate->diffInDays($today) . ' days remaining)'
                    ];
                }
            }
        }

        return response()->json([
            'success' => true,
            'stats' => [
                'total_equipment' => $totalCount,
                'active_working' => $workingCount,
                'under_maintenance' => $maintenanceCount,
                'out_of_service' => $outOfServiceCount,
                'maintenance_due' => $dueCount
            ],
            'alerts' => array_slice($alerts, 0, 10)
        ]);
    }

    public function getItems(Request $request)
    {
        $this->autoSeedCategories();
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $query = EquipmentItem::with(['category'])->where('gym_id', $gymId);

        if ($request->filled('search')) {
            $s = '%' . $request->search . '%';
            $query->where(function($q) use ($s) {
                $q->where('name', 'like', $s)
                  ->orWhere('asset_code', 'like', $s)
                  ->orWhere('brand', 'like', $s);
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('branch')) {
            $query->where('branch', $request->branch);
        }

        $perPage = $request->get('per_page', 15);
        $records = $query->orderBy('name', 'asc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $records->items(),
            'total' => $records->total(),
            'lastPage' => $records->lastPage(),
            'currentPage' => $records->currentPage()
        ]);
    }

    public function storeItem(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $request->validate([
            'name' => 'required|string|max:255',
            'asset_code' => 'nullable|string|unique:equipment_items,asset_code',
            'category_id' => 'required|exists:equipment_categories,id',
            'quantity' => 'required|integer|min:1',
            'purchase_price' => 'nullable|numeric|min:0',
            'invoice' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048'
        ]);

        $invoicePath = null;
        if ($request->hasFile('invoice')) {
            $path = $request->file('invoice')->store('invoices', 'public');
            $invoicePath = asset('storage/' . $path);
        }

        $assetCode = $request->asset_code;
        if (empty($assetCode)) {
            $lastId = EquipmentItem::max('id') ?? 0;
            $assetCode = 'EQ-' . str_pad($lastId + 1, 4, '0', STR_PAD_LEFT);
        }

        $qty = (int)$request->quantity;
        $price = (float)($request->purchase_price ?? 0);
        $isPerUnit = filter_var($request->is_price_per_unit, FILTER_VALIDATE_BOOLEAN);
        $totalCost = $isPerUnit ? ($qty * $price) : $price;

        $itemsCreated = [];

        // Condition Check: Create Individual Assets vs Quantity-Based
        if ($qty > 1 && filter_var($request->create_individual_assets, FILTER_VALIDATE_BOOLEAN)) {
            // Parent container item
            $parent = EquipmentItem::create(array_merge($request->all(), [
                'gym_id' => $gymId,
                'asset_code' => $assetCode,
                'quantity' => $qty,
                'invoice_path' => $invoicePath,
                'purchase_price' => $price,
                'is_price_per_unit' => $isPerUnit
            ]));
            $itemsCreated[] = $parent;

            // Generate children individual rows
            for ($i = 1; $i <= $qty; $i++) {
                $codeSuffix = '-' . str_pad($i, 2, '0', STR_PAD_LEFT);
                EquipmentItem::create(array_merge($request->all(), [
                    'gym_id' => $gymId,
                    'asset_code' => $assetCode . $codeSuffix,
                    'quantity' => 1,
                    'parent_id' => $parent->id,
                    'invoice_path' => $invoicePath,
                    'purchase_price' => $isPerUnit ? $price : ($price / $qty),
                    'is_price_per_unit' => true
                ]));
            }
        } else {
            $item = EquipmentItem::create(array_merge($request->all(), [
                'gym_id' => $gymId,
                'asset_code' => $assetCode,
                'invoice_path' => $invoicePath,
                'purchase_price' => $price,
                'is_price_per_unit' => $isPerUnit
            ]));
            $itemsCreated[] = $item;
        }

        // Integration: Add Purchase to Expenses
        if ($totalCost > 0 && filter_var($request->add_to_expenses, FILTER_VALIDATE_BOOLEAN)) {
            Expense::create([
                'gym_id' => $gymId,
                'title' => 'Equipment: ' . $request->name . ' (x' . $qty . ')',
                'amount' => $totalCost,
                'category' => 'Equipment Purchase',
                'date' => $request->purchase_date ?? Carbon::today()->toDateString(),
                'payment_method' => 'Bank',
                'payment_status' => 'Paid',
                'paid_to' => $request->supplier ?? 'Equipment Vendor',
                'reference_no' => $request->invoice_no,
                'receipt_path' => $invoicePath,
                'description' => 'Auto-generated purchase from Equipment Module. ' . ($request->description ?? ''),
                'is_recurring' => 0
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Equipment registered successfully',
            'data' => $itemsCreated[0]
        ], 201);
    }

    public function updateItem(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:equipment_categories,id',
            'invoice' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048'
        ]);

        $item = EquipmentItem::find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Equipment not found'], 404);
        }

        $data = $request->except(['invoice']);

        if ($request->hasFile('invoice')) {
            $path = $request->file('invoice')->store('invoices', 'public');
            $data['invoice_path'] = asset('storage/' . $path);
        }

        $item->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Equipment details updated successfully',
            'data' => $item
        ]);
    }

    public function deleteItem($id)
    {
        $item = EquipmentItem::find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Equipment not found'], 404);
        }
        $item->delete();
        return response()->json(['success' => true, 'message' => 'Equipment deleted successfully']);
    }

    // --- Maintenance Management ---

    public function addMaintenance(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $request->validate([
            'equipment_id' => 'required|exists:equipment_items,id',
            'type' => 'required|string',
            'date' => 'required|date',
            'cost' => 'nullable|numeric|min:0',
            'bill' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048'
        ]);

        $billPath = null;
        if ($request->hasFile('bill')) {
            $path = $request->file('bill')->store('service_bills', 'public');
            $billPath = asset('storage/' . $path);
        }

        $maint = EquipmentMaintenance::create(array_merge($request->all(), [
            'gym_id' => $gymId,
            'bill_path' => $billPath,
            'status' => $request->status ?? 'Completed'
        ]));

        $item = EquipmentItem::find($request->equipment_id);

        // Update Equipment status if complete or if requested
        if ($request->filled('update_equipment_status')) {
            $item->update(['status' => $request->update_equipment_status]);
        }

        // Integration: Add to Expenses
        $cost = (float)($request->cost ?? 0);
        if ($cost > 0 && filter_var($request->add_to_expenses, FILTER_VALIDATE_BOOLEAN)) {
            Expense::create([
                'gym_id' => $gymId,
                'title' => 'Maint: ' . $item->name . ' (' . $request->type . ')',
                'amount' => $cost,
                'category' => 'Equipment Maintenance',
                'date' => $request->date,
                'payment_method' => 'Cash',
                'payment_status' => 'Paid',
                'paid_to' => $request->technician ?? 'Service Provider',
                'reference_no' => $item->asset_code,
                'receipt_path' => $billPath,
                'description' => 'Work Done: ' . ($request->description ?? '') . '. Parts Replaced: ' . ($request->parts_replaced ?? ''),
                'is_recurring' => 0
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Maintenance record saved successfully',
            'data' => $maint
        ], 201);
    }

    public function getServiceHistory(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $query = EquipmentMaintenance::with(['equipment'])->where('gym_id', $gymId);

        if ($request->filled('equipment_id')) {
            $query->where('equipment_id', $request->equipment_id);
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $perPage = $request->get('per_page', 20);
        $records = $query->orderBy('date', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $records->items(),
            'total' => $records->total(),
            'lastPage' => $records->lastPage(),
            'currentPage' => $records->currentPage()
        ]);
    }

    // --- Reports ---

    public function getReports(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $reportType = $request->get('type', 'list');
        $query = EquipmentItem::with(['category'])->where('gym_id', $gymId);

        if ($request->filled('branch')) {
            $query->where('branch', $request->branch);
        }
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($reportType === 'condition') {
            if ($request->filled('condition')) {
                $query->where('condition', $request->condition);
            }
        } elseif ($reportType === 'out_of_service') {
            $query->where('status', 'Out of Service');
        } elseif ($reportType === 'warranty') {
            $query->where('warranty_available', 1);
            if ($request->get('warranty_status') === 'Expired') {
                $query->where('warranty_end_date', '<', Carbon::today()->toDateString());
            } elseif ($request->get('warranty_status') === 'Expiring Soon') {
                $query->whereBetween('warranty_end_date', [Carbon::today()->toDateString(), Carbon::today()->addDays(30)->toDateString()]);
            }
        }

        $items = $query->orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $items
        ]);
    }

    // --- Categories CRUD ---

    public function getCategories(Request $request)
    {
        $this->autoSeedCategories();
        $cats = EquipmentCategory::orderBy('name', 'asc')->get();
        return response()->json(['success' => true, 'data' => $cats]);
    }

    public function storeCategory(Request $request)
    {
        $request->validate(['name' => 'required|string|unique:equipment_categories,name']);
        $cat = EquipmentCategory::create($request->all());
        return response()->json(['success' => true, 'data' => $cat], 201);
    }

    public function updateCategory(Request $request, $id)
    {
        $request->validate(['name' => 'required|string|unique:equipment_categories,name,' . $id]);
        $cat = EquipmentCategory::find($id);
        if (!$cat) {
            return response()->json(['success' => false, 'message' => 'Category not found'], 404);
        }
        $cat->update($request->all());
        return response()->json(['success' => true, 'data' => $cat]);
    }

    public function deleteCategory($id)
    {
        $cat = EquipmentCategory::find($id);
        if (!$cat) {
            return response()->json(['success' => false, 'message' => 'Category not found'], 404);
        }
        $cat->delete();
        return response()->json(['success' => true, 'message' => 'Category deleted']);
    }
}

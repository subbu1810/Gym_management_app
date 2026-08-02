<?php

namespace App\Http\Controllers;

use App\Models\InventoryCategory;
use App\Models\InventorySupplier;
use App\Models\InventoryItem;
use App\Models\InventoryHistory;
use App\Models\Expense;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InventoryController extends Controller
{
    private function autoSeedCategories()
    {
        if (InventoryCategory::count() === 0) {
            $defaults = [
                'Supplements', 'Protein & Nutrition', 'Beverages',
                'Gym Accessories', 'Merchandise', 'Cleaning Supplies',
                'Office Supplies', 'Consumables', 'Other'
            ];
            foreach ($defaults as $name) {
                InventoryCategory::create(['name' => $name, 'status' => 'active']);
            }
        }
    }

    public function getDashboard(Request $request)
    {
        $this->autoSeedCategories();
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $items = InventoryItem::where('gym_id', $gymId)->get();

        $totalItems = $items->count();
        $totalStockValue = 0;
        $lowStockCount = 0;
        $outOfStockCount = 0;
        $expiringSoonCount = 0;

        $today = Carbon::today();
        $thirtyDaysFromNow = Carbon::today()->addDays(30);

        $lowStockAlerts = [];
        $expiryAlerts = [];

        foreach ($items as $item) {
            $totalStockValue += ($item->current_stock * $item->purchase_price);

            if ($item->current_stock === 0) {
                $outOfStockCount++;
                $lowStockAlerts[] = [
                    'id' => $item->id,
                    'sku' => $item->sku,
                    'name' => $item->name,
                    'current' => $item->current_stock,
                    'required' => $item->reorder_level,
                    'status' => 'Out of Stock'
                ];
            } elseif ($item->current_stock <= $item->reorder_level) {
                $lowStockCount++;
                $lowStockAlerts[] = [
                    'id' => $item->id,
                    'sku' => $item->sku,
                    'name' => $item->name,
                    'current' => $item->current_stock,
                    'required' => $item->reorder_level,
                    'status' => 'Low Stock'
                ];
            }

            if ($item->expiry_date) {
                $expDate = Carbon::parse($item->expiry_date);
                if ($expDate->isPast()) {
                    $expiryAlerts[] = [
                        'id' => $item->id,
                        'sku' => $item->sku,
                        'name' => $item->name,
                        'expiry' => $item->expiry_date,
                        'status' => 'Expired'
                    ];
                } elseif ($expDate->between($today, $thirtyDaysFromNow)) {
                    $expiringSoonCount++;
                    $expiryAlerts[] = [
                        'id' => $item->id,
                        'sku' => $item->sku,
                        'name' => $item->name,
                        'expiry' => $item->expiry_date,
                        'status' => 'Expiring Soon'
                    ];
                }
            }
        }

        return response()->json([
            'success' => true,
            'stats' => [
                'total_items' => $totalItems,
                'total_stock_value' => (float)$totalStockValue,
                'low_stock_items' => $lowStockCount,
                'out_of_stock_items' => $outOfStockCount,
                'expiring_soon' => $expiringSoonCount,
            ],
            'low_stock_alerts' => array_slice($lowStockAlerts, 0, 10),
            'expiry_alerts' => array_slice($expiryAlerts, 0, 10),
        ]);
    }

    // --- Items / Products CRUD ---

    public function getItems(Request $request)
    {
        $this->autoSeedCategories();
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $query = InventoryItem::with(['category', 'supplier'])->where('gym_id', $gymId);

        if ($request->filled('search')) {
            $s = '%' . $request->search . '%';
            $query->where(function($q) use ($s) {
                $q->where('name', 'like', $s)
                  ->orWhere('sku', 'like', $s)
                  ->orWhere('brand', 'like', $s);
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->filled('branch')) {
            $query->where('branch', $request->branch);
        }

        if ($request->filled('status')) {
            $st = $request->status;
            if ($st === 'In Stock') {
                $query->where('current_stock', '>', DB::raw('reorder_level'));
            } elseif ($st === 'Low Stock') {
                $query->where('current_stock', '>', 0)
                      ->where('current_stock', '<=', DB::raw('reorder_level'));
            } elseif ($st === 'Out of Stock') {
                $query->where('current_stock', 0);
            } elseif ($st === 'Expiring Soon') {
                $today = Carbon::today()->toDateString();
                $thirtyDays = Carbon::today()->addDays(30)->toDateString();
                $query->whereBetween('expiry_date', [$today, $thirtyDays]);
            }
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
            'sku' => 'nullable|string|unique:inventory_items,sku',
            'category_id' => 'required|exists:inventory_categories,id',
            'opening_stock' => 'required|integer|min:0',
            'unit' => 'required|string',
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'nullable|numeric|min:0',
            'image' => 'nullable|image|max:2048'
        ]);

        $sku = $request->sku;
        if (empty($sku)) {
            $lastId = InventoryItem::max('id') ?? 0;
            $sku = 'SKU-' . str_pad($lastId + 1, 5, '0', STR_PAD_LEFT);
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $imagePath = asset('storage/' . $path);
        }

        $item = InventoryItem::create([
            'gym_id' => $gymId,
            'sku' => $sku,
            'name' => $request->name,
            'category_id' => $request->category_id,
            'brand' => $request->brand,
            'description' => $request->description,
            'image_path' => $imagePath,
            'opening_stock' => $request->opening_stock,
            'current_stock' => $request->opening_stock,
            'unit' => $request->unit,
            'reorder_level' => $request->reorder_level ?? 5,
            'purchase_price' => $request->purchase_price,
            'selling_price' => $request->selling_price,
            'tax_percent' => $request->tax_percent ?? 0,
            'supplier_id' => $request->supplier_id,
            'purchase_date' => $request->purchase_date,
            'batch_number' => $request->batch_number,
            'expiry_date' => $request->expiry_date,
            'location' => $request->location,
            'branch' => $request->branch
        ]);

        // Log opening stock in history
        if ($item->opening_stock > 0) {
            InventoryHistory::create([
                'gym_id' => $gymId,
                'item_id' => $item->id,
                'type' => 'Stock In',
                'quantity' => $item->opening_stock,
                'prev_stock' => 0,
                'new_stock' => $item->opening_stock,
                'reason' => 'Opening Stock',
                'date' => Carbon::today()->toDateString(),
                'notes' => 'Initial opening stock allocation',
                'created_by' => $authUser['name'] ?? 'Admin'
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Item created successfully',
            'data' => $item
        ], 201);
    }

    public function updateItem(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|unique:inventory_items,sku,' . $id,
            'category_id' => 'required|exists:inventory_categories,id',
            'unit' => 'required|string',
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'nullable|numeric|min:0',
            'image' => 'nullable|image|max:2048'
        ]);

        $item = InventoryItem::find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Item not found'], 404);
        }

        $data = $request->except(['image']);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $data['image_path'] = asset('storage/' . $path);
        }

        $item->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Item updated successfully',
            'data' => $item
        ]);
    }

    public function deleteItem($id)
    {
        $item = InventoryItem::find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Item not found'], 404);
        }
        $item->delete();
        return response()->json(['success' => true, 'message' => 'Item deleted successfully']);
    }

    // --- Stock In / Out Operations ---

    public function stockIn(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $request->validate([
            'item_id' => 'required|exists:inventory_items,id',
            'quantity' => 'required|integer|min:1',
            'date' => 'required|date',
            'reason' => 'required|string',
            'receipt' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048'
        ]);

        $item = InventoryItem::find($request->item_id);
        $prevStock = $item->current_stock;
        $qty = (int)$request->quantity;
        $newStock = $prevStock + $qty;

        $receiptPath = null;
        if ($request->hasFile('receipt')) {
            $path = $request->file('receipt')->store('receipts', 'public');
            $receiptPath = asset('storage/' . $path);
        }

        // Update item stock
        $item->update(['current_stock' => $newStock]);

        // Optionally update batch / expiry / price details if provided on stock-in
        if ($request->filled('purchase_price')) {
            $item->update(['purchase_price' => $request->purchase_price]);
        }
        if ($request->filled('batch_number')) {
            $item->update(['batch_number' => $request->batch_number]);
        }
        if ($request->filled('expiry_date')) {
            $item->update(['expiry_date' => $request->expiry_date]);
        }

        // Log history
        $history = InventoryHistory::create([
            'gym_id' => $gymId,
            'item_id' => $item->id,
            'type' => 'Stock In',
            'quantity' => $qty,
            'prev_stock' => $prevStock,
            'new_stock' => $newStock,
            'reason' => $request->reason,
            'reference' => $request->invoice_no,
            'supplier_id' => $request->supplier_id,
            'date' => $request->date,
            'notes' => $request->notes,
            'receipt_path' => $receiptPath,
            'created_by' => $authUser['name'] ?? 'Admin'
        ]);

        // Integration: Add to Expenses
        if ($request->reason === 'Purchase' && filter_var($request->add_to_expenses, FILTER_VALIDATE_BOOLEAN)) {
            $totalCost = $qty * ($request->purchase_price ?? $item->purchase_price);
            $supplierName = 'Inventory Supplier';
            if ($request->filled('supplier_id')) {
                $supp = InventorySupplier::find($request->supplier_id);
                if ($supp) $supplierName = $supp->name;
            }

            Expense::create([
                'gym_id' => $gymId,
                'title' => 'Purchase: ' . $item->name . ' (x' . $qty . ')',
                'amount' => $totalCost,
                'category' => 'Supplements / Inventory Purchase',
                'date' => $request->date,
                'payment_method' => 'Bank', // default
                'payment_status' => 'Paid',
                'paid_to' => $supplierName,
                'reference_no' => $request->invoice_no,
                'receipt_path' => $receiptPath,
                'description' => 'Auto-generated from Stock In. ' . ($request->notes ?? ''),
                'is_recurring' => 0
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Stock In processed successfully',
            'data' => $item
        ]);
    }

    public function stockOut(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $request->validate([
            'item_id' => 'required|exists:inventory_items,id',
            'quantity' => 'required|integer|min:1',
            'date' => 'required|date',
            'reason' => 'required|string',
        ]);

        $item = InventoryItem::find($request->item_id);
        $prevStock = $item->current_stock;
        $qty = (int)$request->quantity;

        if ($qty > $prevStock) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot stock out more than available stock (' . $prevStock . ')'
            ], 422);
        }

        $newStock = $prevStock - $qty;

        // Update item stock
        $item->update(['current_stock' => $newStock]);

        // Log history
        $history = InventoryHistory::create([
            'gym_id' => $gymId,
            'item_id' => $item->id,
            'type' => 'Stock Out',
            'quantity' => $qty,
            'prev_stock' => $prevStock,
            'new_stock' => $newStock,
            'reason' => $request->reason,
            'reference' => $request->reference,
            'date' => $request->date,
            'notes' => $request->notes,
            'created_by' => $authUser['name'] ?? 'Admin'
        ]);

        // Integration: Record Sales revenue
        if ($request->reason === 'Sold' && $item->selling_price > 0) {
            $totalSale = $qty * $item->selling_price;
            Payment::create([
                'gym_id' => $gymId,
                'amount' => $totalSale,
                'payment_status' => 'Paid',
                'p_status' => 'Paid',
                'payment_method' => 'Cash',
                'payment_date' => $request->date,
                'remarks' => 'Auto-generated Sale: ' . $item->name . ' (x' . $qty . '). ' . ($request->notes ?? ''),
                'user_id' => null, // guest sale
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Stock Out processed successfully',
            'data' => $item
        ]);
    }

    // --- History Logs ---

    public function getHistory(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $query = InventoryHistory::with(['item.category', 'supplier'])->where('gym_id', $gymId);

        if ($request->filled('item_id')) {
            $query->where('item_id', $request->item_id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('date_from')) {
            $query->where('date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('date', '<=', $request->date_to);
        }

        $perPage = $request->get('per_page', 20);
        $records = $query->orderBy('date', 'desc')->orderBy('id', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $records->items(),
            'total' => $records->total(),
            'lastPage' => $records->lastPage(),
            'currentPage' => $records->currentPage()
        ]);
    }

    // --- Categories CRUD ---

    public function getCategories(Request $request)
    {
        $this->autoSeedCategories();
        $categories = InventoryCategory::orderBy('name', 'asc')->get();
        return response()->json(['success' => true, 'data' => $categories]);
    }

    public function storeCategory(Request $request)
    {
        $request->validate(['name' => 'required|string|unique:inventory_categories,name']);
        $cat = InventoryCategory::create([
            'name' => $request->name,
            'status' => $request->status ?? 'active'
        ]);
        return response()->json(['success' => true, 'data' => $cat], 201);
    }

    public function updateCategory(Request $request, $id)
    {
        $request->validate(['name' => 'required|string|unique:inventory_categories,name,' . $id]);
        $cat = InventoryCategory::find($id);
        if (!$cat) {
            return response()->json(['success' => false, 'message' => 'Category not found'], 404);
        }
        $cat->update($request->all());
        return response()->json(['success' => true, 'data' => $cat]);
    }

    public function deleteCategory($id)
    {
        $cat = InventoryCategory::find($id);
        if (!$cat) {
            return response()->json(['success' => false, 'message' => 'Category not found'], 404);
        }
        $cat->delete();
        return response()->json(['success' => true, 'message' => 'Category deleted successfully']);
    }

    // --- Suppliers CRUD ---

    public function getSuppliers(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $suppliers = InventorySupplier::where('gym_id', $gymId)->orderBy('name', 'asc')->get();
        
        // Compute total purchases count or pending per supplier if needed
        $data = [];
        foreach ($suppliers as $sup) {
            $totalCost = DB::table('inventory_history')
                ->where('supplier_id', $sup->id)
                ->where('type', 'Stock In')
                ->sum(DB::raw('quantity * prev_stock')); // dummy total purchase metric

            $data[] = array_merge($sup->toArray(), [
                'total_purchases' => $totalCost,
                'pending_amount' => 0.00
            ]);
        }

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function storeSupplier(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string',
        ]);

        $sup = InventorySupplier::create(array_merge($request->all(), ['gym_id' => $gymId]));
        return response()->json(['success' => true, 'data' => $sup], 201);
    }

    public function updateSupplier(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string',
        ]);

        $sup = InventorySupplier::find($id);
        if (!$sup) {
            return response()->json(['success' => false, 'message' => 'Supplier not found'], 404);
        }
        $sup->update($request->all());
        return response()->json(['success' => true, 'data' => $sup]);
    }

    public function deleteSupplier($id)
    {
        $sup = InventorySupplier::find($id);
        if (!$sup) {
            return response()->json(['success' => false, 'message' => 'Supplier not found'], 404);
        }
        $sup->delete();
        return response()->json(['success' => true, 'message' => 'Supplier deleted successfully']);
    }

    // --- Reports Endpoint ---

    public function getReports(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $reportType = $request->get('type', 'current_stock');
        $query = InventoryItem::with(['category', 'supplier'])->where('gym_id', $gymId);

        if ($request->filled('branch')) {
            $query->where('branch', $request->branch);
        }

        if ($reportType === 'low_stock') {
            $query->where('current_stock', '<=', DB::raw('reorder_level'));
        } elseif ($reportType === 'out_of_stock') {
            $query->where('current_stock', 0);
        } elseif ($reportType === 'expiry') {
            $query->whereNotNull('expiry_date');
            if ($request->get('expiry_status') === 'Expired') {
                $query->where('expiry_date', '<', Carbon::today()->toDateString());
            } elseif ($request->get('expiry_status') === 'Expiring Soon') {
                $query->whereBetween('expiry_date', [Carbon::today()->toDateString(), Carbon::today()->addDays(30)->toDateString()]);
            }
        }

        $items = $query->orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $items
        ]);
    }

    public function getSalesReport(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $query = DB::table('inventory_history')
            ->join('inventory_items', 'inventory_history.item_id', '=', 'inventory_items.id')
            ->join('inventory_categories', 'inventory_items.category_id', '=', 'inventory_categories.id')
            ->where('inventory_history.gym_id', $gymId)
            ->where('inventory_history.type', 'Stock Out')
            ->where('inventory_history.reason', 'Sold')
            ->select(
                'inventory_history.*',
                'inventory_items.name as item_name',
                'inventory_items.sku as item_sku',
                'inventory_items.selling_price as unit_selling_price',
                'inventory_categories.name as category_name',
                DB::raw('(inventory_history.quantity * inventory_items.selling_price) as total_amount')
            );

        if ($request->filled('category_id')) {
            $query->where('inventory_items.category_id', $request->category_id);
        }
        if ($request->filled('date_from')) {
            $query->where('inventory_history.date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('inventory_history.date', '<=', $request->date_to);
        }
        if ($request->filled('search')) {
            $s = '%' . $request->search . '%';
            $query->where(function($q) use ($s) {
                $q->where('inventory_items.name', 'like', $s)
                  ->orWhere('inventory_items.sku', 'like', $s);
            });
        }

        // Totals
        $totalSalesCount = (clone $query)->sum('inventory_history.quantity');
        $totalSalesVal = (clone $query)->sum(DB::raw('inventory_history.quantity * inventory_items.selling_price'));

        $perPage = $request->get('per_page', 15);
        $records = $query->orderBy('inventory_history.date', 'desc')->orderBy('inventory_history.id', 'desc')->paginate($perPage);

        // Group by category sales
        $categorySales = DB::table('inventory_history')
            ->join('inventory_items', 'inventory_history.item_id', '=', 'inventory_items.id')
            ->join('inventory_categories', 'inventory_items.category_id', '=', 'inventory_categories.id')
            ->where('inventory_history.gym_id', $gymId)
            ->where('inventory_history.type', 'Stock Out')
            ->where('inventory_history.reason', 'Sold')
            ->select('inventory_categories.name as category_name', DB::raw('SUM(inventory_history.quantity * inventory_items.selling_price) as total'))
            ->groupBy('inventory_categories.name');

        if ($request->filled('date_from')) {
            $categorySales->where('inventory_history.date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $categorySales->where('inventory_history.date', '<=', $request->date_to);
        }
        $categorySummary = $categorySales->get();

        return response()->json([
            'success' => true,
            'data' => $records->items(),
            'total' => $records->total(),
            'lastPage' => $records->lastPage(),
            'currentPage' => $records->currentPage(),
            'total_sales_count' => (int)$totalSalesCount,
            'total_sales_value' => (float)$totalSalesVal,
            'category_summary' => $categorySummary
        ]);
    }
}

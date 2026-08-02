<?php

use App\Http\Controllers\AuthController;
// use App\Http\Controllers\BookingController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\GymController;
use App\Http\Controllers\SuperAdminController;
use App\Http\Controllers\TrainerController;
use App\Http\Controllers\WorkoutController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\MemberController;
use Illuminate\Support\Facades\Route;

// Health check
Route::get('/health', function () {
    return response()->json(['status' => 'OK', 'message' => 'Backend is running']);
});

// Auth routes (public)
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'adminLogin']);
    Route::post('/member-login', [AuthController::class, 'memberLogin']);
    Route::post('/trainer-login', [AuthController::class, 'trainerLogin']);
    Route::post('/forgot-password/request-otp', [AuthController::class, 'requestPasswordResetOtp']);
    Route::post('/forgot-password/verify-otp',  [AuthController::class, 'verifyPasswordResetOtp']);
    Route::post('/forgot-password/reset',        [AuthController::class, 'resetAdminPassword']);
});

// Payment routes (public — payment gateway callbacks)
Route::prefix('payment')->group(function () {
    Route::post('/create-order', [PaymentController::class, 'createOrder']);
    Route::post('/verify',       [PaymentController::class, 'verifyPayment']);
});

// Booking create (public — members submit the form without logging in)
// (Removed bookings route)

// Gyms routes (public)
Route::post('/gyms/register', [GymController::class, 'register']);
Route::get('/gyms', [GymController::class, 'index']);

// Protected routes (require JWT)
Route::middleware('jwt.auth')->group(function () {
    Route::get('/plans', [App\Http\Controllers\PlanController::class, 'index']);
    Route::post('/plans', [App\Http\Controllers\PlanController::class, 'store']);
    Route::put('/plans/{id}', [App\Http\Controllers\PlanController::class, 'update']);
    Route::delete('/plans/{id}', [App\Http\Controllers\PlanController::class, 'destroy']);

    Route::get('/admin/dashboard-stats', [AdminController::class, 'getDashboardStats']);
    Route::get('/admin/dashboard-init', [AdminController::class, 'getDashboardInit']);

    Route::get('/gym/settings', [GymController::class, 'getSettings']);
    Route::post('/gym/settings', [GymController::class, 'updateSettings']);
    Route::post('/gym/settings/logo', [GymController::class, 'updateLogo']);
    Route::post('/gym/settings/notifications', [GymController::class, 'updateNotifications']);
    Route::post('/gym/settings/payments', [GymController::class, 'updatePaymentSettings']);
    Route::post('/gym/settings/tax', [GymController::class, 'updateTaxSettings']);
    Route::post('/gym/settings/integrations', [GymController::class, 'updateIntegrationSettings']);
    Route::post('/gym/settings/wallet/create-order', [GymController::class, 'createWalletOrder']);
    Route::post('/gym/settings/wallet/verify-recharge', [GymController::class, 'verifyWalletRecharge']);
    Route::get('/gym/settings/wallet/transactions', [GymController::class, 'getWalletTransactions']);

    Route::get('/backups', [App\Http\Controllers\BackupController::class, 'index']);
    Route::post('/backups', [App\Http\Controllers\BackupController::class, 'create']);
    Route::post('/backups/restore', [App\Http\Controllers\BackupController::class, 'restore']);
    Route::post('/backups/upload', [App\Http\Controllers\BackupController::class, 'upload']);
    Route::delete('/backups/{filename}', [App\Http\Controllers\BackupController::class, 'destroy']);
    Route::get('/backups/download/{filename}', [App\Http\Controllers\BackupController::class, 'download']);

    Route::get('/system-logs', [App\Http\Controllers\LogController::class, 'index']);
    Route::delete('/system-logs', [App\Http\Controllers\LogController::class, 'clear']);
    Route::get('/system-logs/download', [App\Http\Controllers\LogController::class, 'download']);

    // New Features
    Route::apiResource('members', MemberController::class);
    Route::apiResource('trainers', TrainerController::class);
    Route::apiResource('workouts', WorkoutController::class);
    Route::apiResource('attendances', AttendanceController::class);
    Route::apiResource('payments-crud', App\Http\Controllers\PaymentCrudController::class);
    Route::apiResource('expenses', App\Http\Controllers\ExpenseController::class);

    // Inventory Management
    Route::get('/inventory/dashboard', [App\Http\Controllers\InventoryController::class, 'getDashboard']);
    Route::get('/inventory/items', [App\Http\Controllers\InventoryController::class, 'getItems']);
    Route::post('/inventory/items', [App\Http\Controllers\InventoryController::class, 'storeItem']);
    Route::put('/inventory/items/{id}', [App\Http\Controllers\InventoryController::class, 'updateItem']);
    Route::delete('/inventory/items/{id}', [App\Http\Controllers\InventoryController::class, 'deleteItem']);
    Route::post('/inventory/stock-in', [App\Http\Controllers\InventoryController::class, 'stockIn']);
    Route::post('/inventory/stock-out', [App\Http\Controllers\InventoryController::class, 'stockOut']);
    Route::get('/inventory/history', [App\Http\Controllers\InventoryController::class, 'getHistory']);
    Route::get('/inventory/categories', [App\Http\Controllers\InventoryController::class, 'getCategories']);
    Route::post('/inventory/categories', [App\Http\Controllers\InventoryController::class, 'storeCategory']);
    Route::put('/inventory/categories/{id}', [App\Http\Controllers\InventoryController::class, 'updateCategory']);
    Route::delete('/inventory/categories/{id}', [App\Http\Controllers\InventoryController::class, 'deleteCategory']);
    Route::get('/inventory/suppliers', [App\Http\Controllers\InventoryController::class, 'getSuppliers']);
    Route::post('/inventory/suppliers', [App\Http\Controllers\InventoryController::class, 'storeSupplier']);
    Route::put('/inventory/suppliers/{id}', [App\Http\Controllers\InventoryController::class, 'updateSupplier']);
    Route::delete('/inventory/suppliers/{id}', [App\Http\Controllers\InventoryController::class, 'deleteSupplier']);
    Route::get('/inventory/reports', [App\Http\Controllers\InventoryController::class, 'getReports']);
    Route::get('/inventory/sales-report', [App\Http\Controllers\InventoryController::class, 'getSalesReport']);

    // Equipment Management
    Route::get('/equipment/dashboard', [App\Http\Controllers\EquipmentController::class, 'getDashboard']);
    Route::get('/equipment/items', [App\Http\Controllers\EquipmentController::class, 'getItems']);
    Route::post('/equipment/items', [App\Http\Controllers\EquipmentController::class, 'storeItem']);
    Route::put('/equipment/items/{id}', [App\Http\Controllers\EquipmentController::class, 'updateItem']);
    Route::delete('/equipment/items/{id}', [App\Http\Controllers\EquipmentController::class, 'deleteItem']);
    Route::post('/equipment/maintenance', [App\Http\Controllers\EquipmentController::class, 'addMaintenance']);
    Route::get('/equipment/service-history', [App\Http\Controllers\EquipmentController::class, 'getServiceHistory']);
    Route::get('/equipment/reports', [App\Http\Controllers\EquipmentController::class, 'getReports']);
    Route::get('/equipment/categories', [App\Http\Controllers\EquipmentController::class, 'getCategories']);
    Route::post('/equipment/categories', [App\Http\Controllers\EquipmentController::class, 'storeCategory']);
    Route::put('/equipment/categories/{id}', [App\Http\Controllers\EquipmentController::class, 'updateCategory']);
    Route::delete('/equipment/categories/{id}', [App\Http\Controllers\EquipmentController::class, 'deleteCategory']);

    // Super Admin Routes
    Route::get('/super-admin/gyms', [SuperAdminController::class, 'getGyms']);
    Route::put('/super-admin/gyms/{id}/subscription', [SuperAdminController::class, 'updateSubscription']);
    Route::put('/super-admin/gyms/{id}/wallet', [SuperAdminController::class, 'updateWallet']);

    // Reports
    Route::get('/admin/reports/revenue', [App\Http\Controllers\ReportsController::class, 'getRevenueReport']);
    Route::get('/admin/reports/membership', [App\Http\Controllers\ReportsController::class, 'getMembershipReport']);
    Route::get('/admin/reports/attendance', [App\Http\Controllers\ReportsController::class, 'getAttendanceReport']);
    Route::get('/admin/reports/trainer', [App\Http\Controllers\ReportsController::class, 'getTrainerReport']);
    Route::get('/admin/reports/workout', [App\Http\Controllers\ReportsController::class, 'getWorkoutReport']);
    Route::get('/admin/reports/payment', [App\Http\Controllers\ReportsController::class, 'getPaymentReport']);
});

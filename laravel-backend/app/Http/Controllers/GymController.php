<?php

namespace App\Http\Controllers;

use App\Models\Gym;
use App\Models\Admin;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class GymController extends Controller
{
    // POST /api/gyms/register (Public Registration)
    public function register(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:gyms,email',
                'admin_username' => 'required|string|unique:admins,username',
                'admin_password' => 'required|string|min:6',
            ]);

            DB::beginTransaction();

            $gym = Gym::create([
                'name' => $request->input('name'),
                'email' => $request->input('email'),
                'phone' => $request->input('phone'),
                'address' => $request->input('address'),
                'subscription_status' => 'trial',
                'subscription_ends_at' => now()->addDays(14),
            ]);

            Admin::create([
                'gym_id' => $gym->id,
                'role' => 'gym_admin',
                'username' => $request->input('admin_username'),
                'password_hash' => Hash::make($request->input('admin_password')),
                'email' => $request->input('email'),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Gym registered successfully. Trial period started.',
                'gym_id' => $gym->id
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => $e->validator->errors()->first()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Gym registration error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to register gym'], 500);
        }
    }

    // GET /api/gyms (Public listing for users to select)
    public function index()
    {
        $gyms = Gym::select('id', 'name', 'address')->get();
        return response()->json($gyms);
    }

    public function getSettings(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $gym = Gym::find($gymId);
        if (!$gym) {
            return response()->json(['success' => false, 'message' => 'Gym not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $gym
        ]);
    }

    public function updateSettings(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $gym = Gym::find($gymId);
        if (!$gym) {
            return response()->json(['success' => false, 'message' => 'Gym not found'], 404);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'currency' => 'nullable|string',
            'date_format' => 'nullable|string',
            'time_format' => 'nullable|string',
            'timezone' => 'nullable|string',
            'language' => 'nullable|string'
        ]);

        $gym->update($request->only([
            'name', 'email', 'phone', 'address', 'currency',
            'date_format', 'time_format', 'timezone', 'language'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Gym settings updated successfully',
            'data' => $gym
        ]);
    }

    public function updateLogo(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $gym = Gym::find($gymId);
        if (!$gym) {
            return response()->json(['success' => false, 'message' => 'Gym not found'], 404);
        }

        $request->validate([
            'logo' => 'required|image|mimes:jpg,jpeg,png,svg|max:2048'
        ]);

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('logos', 'public');
            $logoUrl = asset('storage/' . $path);
            $gym->update(['logo_path' => $logoUrl]);

            return response()->json([
                'success' => true,
                'message' => 'Gym logo updated successfully',
                'logo_url' => $logoUrl
            ]);
        }

        return response()->json(['success' => false, 'message' => 'No image uploaded'], 422);
    }

    public function updateNotifications(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $gym = Gym::find($gymId);
        if (!$gym) {
            return response()->json(['success' => false, 'message' => 'Gym not found'], 404);
        }

        $gym->update([
            'notification_settings' => $request->input('notification_settings', [])
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Notification preferences updated successfully',
            'data' => $gym
        ]);
    }

    public function updatePaymentSettings(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $gym = Gym::find($gymId);
        if (!$gym) {
            return response()->json(['success' => false, 'message' => 'Gym not found'], 404);
        }

        $request->validate([
            'razorpay_key_id' => 'nullable|string',
            'razorpay_key_secret' => 'nullable|string',
            'enable_online_payment' => 'nullable|boolean',
            'enable_cash' => 'nullable|boolean',
            'enable_upi' => 'nullable|boolean',
            'upi_id' => 'nullable|string',
            'enable_bank_transfer' => 'nullable|boolean',
            'enable_card' => 'nullable|boolean',
        ]);

        $gym->update($request->only([
            'razorpay_key_id', 'razorpay_key_secret', 'enable_online_payment',
            'enable_cash', 'enable_upi', 'upi_id', 'enable_bank_transfer', 'enable_card'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Payment settings updated successfully',
            'data' => $gym
        ]);
    }

    public function updateTaxSettings(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $gym = Gym::find($gymId);
        if (!$gym) {
            return response()->json(['success' => false, 'message' => 'Gym not found'], 404);
        }

        $request->validate([
            'tax_name' => 'required|string|max:50',
            'tax_rate' => 'required|numeric|min:0|max:100',
            'tax_registration_no' => 'nullable|string',
            'tax_calculation_type' => 'required|string|in:inclusive,exclusive',
            'enable_tax' => 'required|boolean'
        ]);

        $gym->update($request->only([
            'tax_name', 'tax_rate', 'tax_registration_no', 'tax_calculation_type', 'enable_tax'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Tax settings updated successfully',
            'data' => $gym
        ]);
    }

    public function updateIntegrationSettings(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $gym = Gym::find($gymId);
        if (!$gym) {
            return response()->json(['success' => false, 'message' => 'Gym not found'], 404);
        }

        $request->validate([
            'twilio_sid' => 'nullable|string',
            'twilio_auth_token' => 'nullable|string',
            'twilio_phone_number' => 'nullable|string',
            'enable_sms' => 'nullable|boolean',
            'enable_whatsapp' => 'nullable|boolean',
            'smtp_host' => 'nullable|string',
            'smtp_port' => 'nullable|integer',
            'smtp_username' => 'nullable|string',
            'smtp_password' => 'nullable|string',
            'smtp_sender_email' => 'nullable|email',
            'smtp_sender_name' => 'nullable|string',
            'smtp_encryption' => 'nullable|string|in:none,ssl,tls',
            'enable_smtp' => 'nullable|boolean',
            'whatsapp_access_token' => 'nullable|string',
            'whatsapp_phone_number_id' => 'nullable|string',
            'whatsapp_business_account_id' => 'nullable|string',
            'enable_whatsapp_meta' => 'nullable|boolean',
            'whatsapp_notify_new_customer' => 'nullable|boolean',
            'whatsapp_notify_payment_updated' => 'nullable|boolean',
            'whatsapp_notify_plan_expiring' => 'nullable|boolean'
        ]);

        $gym->update($request->only([
            'twilio_sid', 'twilio_auth_token', 'twilio_phone_number', 'enable_sms', 'enable_whatsapp',
            'smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_sender_email',
            'smtp_sender_name', 'smtp_encryption', 'enable_smtp',
            'whatsapp_access_token', 'whatsapp_phone_number_id', 'whatsapp_business_account_id', 'enable_whatsapp_meta',
            'whatsapp_notify_new_customer', 'whatsapp_notify_payment_updated', 'whatsapp_notify_plan_expiring'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Integration settings updated successfully',
            'data' => $gym
        ]);
    }

    public function createWalletOrder(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $gym = Gym::find($gymId);
        if (!$gym) {
            return response()->json(['success' => false, 'message' => 'Gym not found'], 404);
        }

        $request->validate([
            'amount' => 'required|numeric|min:100'
        ]);

        $amount = $request->input('amount');
        $rawCurrency = $gym->currency ?? 'Indian Rupee (₹)';
        
        $currencyCode = 'INR';
        if (stripos($rawCurrency, 'Dollar') !== false || stripos($rawCurrency, 'USD') !== false) {
            $currencyCode = 'USD';
        } elseif (stripos($rawCurrency, 'Euro') !== false || stripos($rawCurrency, 'EUR') !== false) {
            $currencyCode = 'EUR';
        }

        // Mock Razorpay Order for now
        return response()->json([
            'success' => true,
            'order' => [
                'id' => 'order_wallet_mock_' . time(),
                'amount' => $amount * 100, // in paise
                'currency' => $currencyCode
            ],
            'key' => $gym->razorpay_key_id // will be used by frontend
        ]);
    }

    public function verifyWalletRecharge(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $gym = Gym::find($gymId);
        if (!$gym) {
            return response()->json(['success' => false, 'message' => 'Gym not found'], 404);
        }

        $request->validate([
            'amount' => 'required|numeric|min:100',
            'razorpay_payment_id' => 'required|string',
            'razorpay_order_id' => 'required|string',
            // 'razorpay_signature' => 'required|string'
        ]);

        // Here you would normally verify the Razorpay signature using the secret key
        // We will assume it's successful for this mock integration

        $amountToAdd = $request->input('amount');
        
        $gym->wallet_balance += $amountToAdd;
        $gym->save();

        WalletTransaction::create([
            'gym_id' => $gym->id,
            'type' => 'credit',
            'amount' => $amountToAdd,
            'balance_after' => $gym->wallet_balance,
            'description' => 'Wallet Recharge via Razorpay',
            'reference_id' => $request->input('razorpay_payment_id')
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Wallet recharged successfully',
            'wallet_balance' => $gym->wallet_balance
        ]);
    }

    public function getWalletTransactions(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? 1;

        $transactions = WalletTransaction::where('gym_id', $gymId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }
}

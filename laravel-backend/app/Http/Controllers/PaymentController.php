<?php

namespace App\Http\Controllers;

use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    // POST /api/payment/create-order
    public function createOrder(Request $request)
    {
        $amount    = $request->input('amount');
        $currency  = $request->input('currency', 'INR');
        $bookingId = $request->input('bookingId');

        try {
            DB::table('payments')
                ->where('booking_id', $bookingId)
                ->update([
                    'amount'         => $amount,
                    'payment_status' => 'Pending',
                ]);

            DB::table('bookings')
                ->where('id', $bookingId)
                ->update(['terms_accepted' => true]);

            return response()->json([
                'success'   => true,
                'order'     => [
                    'id'       => 'order_mock_' . time(),
                    'amount'   => $amount * 100,
                    'currency' => $currency,
                ],
                'bookingId' => $bookingId,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error creating order: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create order',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    // POST /api/payment/verify
    public function verifyPayment(Request $request)
    {
        $bookingId = $request->input('bookingId');

        try {
            DB::table('payments')
                ->where('booking_id', $bookingId)
                ->update(['payment_status' => 'Success']);

            DB::table('bookings')
                ->where('id', $bookingId)
                ->update(['status' => 'Confirmed']);

            // Fetch full booking for notification
            $booking = DB::table('bookings as b')
                ->leftJoin('users as u', 'b.user_id', '=', 'u.id')
                ->leftJoin('payments as p', 'b.id', '=', 'p.booking_id')
                ->select('b.id', 'b.gym_id', 'b.plan_type', 'u.full_name', 'u.email', 'u.phone', 'p.amount')
                ->where('b.id', $bookingId)
                ->first();

            if ($booking) {
                $bookingArr = (array) $booking;

                // Fire and forget (best effort)
                try {
                    $this->notificationService->sendEmailNotification($bookingArr);
                } catch (\Exception $e) {
                    \Log::error('Email Error: ' . $e->getMessage());
                }

                try {
                    $this->notificationService->sendWhatsAppNotification($bookingArr);
                } catch (\Exception $e) {
                    \Log::error('WA Error: ' . $e->getMessage());
                }
            }

            return response()->json(['success' => true, 'message' => 'Payment verified successfully']);
        } catch (\Exception $e) {
            \Log::error('Error verifying payment: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Internal server error'], 500);
        }
    }
}

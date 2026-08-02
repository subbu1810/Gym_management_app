<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;
use Illuminate\Mail\Message;
use App\Models\Gym;

class NotificationService
{
    /**
     * Send booking confirmation email to the member.
     */
    public function sendEmailNotification(array $booking): void
    {
        if (!config('mail.mailers.smtp.username')) {
            \Log::info('Skipping email notification, no EMAIL credentials provided.');
            return;
        }

        $to = $booking['email'] ?? null;
        if (!$to) return;

        Mail::send([], [], function (Message $message) use ($booking) {
            $html = '
                <div style="font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif; max-width: 600px; margin: 0 auto; background-color: #f6f8fa; padding: 40px 20px; text-align: center;">
                    <div style="background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(27,31,35,0.12);">
                        <h1 style="color: #24292e; font-size: 24px; margin-bottom: 24px; font-weight: 500;">Gym Booking Confirmed</h1>
                        <p style="color: #586069; font-size: 16px; margin-bottom: 24px; line-height: 1.5;">
                            Hello ' . ($booking['full_name'] ?? '') . ',<br>
                            Your gym booking has been successfully confirmed. Below are your receipt details:
                        </p>
                        <div style="background-color: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 6px; padding: 20px; margin-bottom: 24px; text-align: left;">
                            <p style="margin: 5px 0; color: #24292e;"><strong>Booking ID:</strong> ' . ($booking['id'] ?? '') . '</p>
                            <p style="margin: 5px 0; color: #24292e;"><strong>Plan Type:</strong> ' . ($booking['plan_type'] ?? '') . '</p>
                            <p style="margin: 5px 0; color: #24292e;"><strong>Amount Paid:</strong> ₹' . ($booking['amount'] ?? '0') . '</p>
                        </div>
                        <p style="color: #586069; font-size: 14px; margin-bottom: 0; line-height: 1.5;">
                            Thank you for choosing us!<br>
                            SsquareGtech Solutions
                        </p>
                    </div>
                </div>
            ';

            $message->to($booking['email'])
                    ->subject('GYM Booking - Payment Receipt')
                    ->setBody($html, 'text/html');
        });

        \Log::info('Email sent to: ' . ($booking['email'] ?? ''));
    }

    /**
     * Trigger a WhatsApp notification via Universal API.
     */
    public function sendWhatsAppNotification(array $booking, string $eventType = 'payment_updated'): void
    {
        $gymId = $booking['gym_id'] ?? 1;
        $gym = Gym::find($gymId);

        if (!$gym) {
            \Log::info("Universal WhatsApp: Cancelled. Gym not found.");
            return;
        }

        if (!$gym->enable_whatsapp_meta) {
            \Log::info("Universal WhatsApp: Cancelled. Automated Messaging is disabled globally for Gym ID {$gymId}.");
            return;
        }

        // Check specific event toggles
        if ($eventType === 'payment_updated' && !$gym->whatsapp_notify_payment_updated) {
            \Log::info("Universal WhatsApp: Cancelled. 'Payment Updated' notification is disabled for Gym ID {$gymId}.");
            return;
        }

        if ($eventType === 'new_customer' && !$gym->whatsapp_notify_new_customer) {
            \Log::info("Universal WhatsApp: Cancelled. 'New Customer' notification is disabled for Gym ID {$gymId}.");
            return;
        }

        if ($eventType === 'plan_expiring' && !$gym->whatsapp_notify_plan_expiring) {
            \Log::info("Universal WhatsApp: Cancelled. 'Plan Expiring' notification is disabled for Gym ID {$gymId}.");
            return;
        }

        // Check wallet balance before proceeding
        if ($gym->wallet_balance < 0.50) {
            \Log::warning("Meta WhatsApp: Cancelled. Insufficient wallet balance for Gym ID {$gymId}. Current balance: {$gym->wallet_balance}");
            return;
        }

        // --- META WHATSAPP CLOUD API IMPLEMENTATION ---
        $phoneNumberId = $gym->whatsapp_phone_number_id;
        $accessToken = $gym->whatsapp_access_token;

        if (!$phoneNumberId || !$accessToken) {
            \Log::warning("Meta WhatsApp: Cancelled. Credentials missing for Gym ID {$gymId}.");
            return;
        }

        $url = "https://graph.facebook.com/v19.0/{$phoneNumberId}/messages";
        
        // Clean phone number and ensure country code (assuming India +91 if 10 digits)
        $phone = preg_replace('/[^0-9]/', '', $booking['phone'] ?? '');
        if (strlen($phone) === 10) {
            $phone = '91' . $phone; 
        }

        // Meta requires pre-approved templates for business-initiated messages.
        // Replace these with your actual approved template names from your Meta Dashboard.
        $templateName = 'hello_world'; // fallback
        $components = [];

        if ($eventType === 'new_customer') {
            $templateName = 'new_member_welcome'; // e.g., Welcome {{1}}
            $components = [
                [
                    'type' => 'body',
                    'parameters' => [
                        ['type' => 'text', 'text' => $booking['full_name'] ?? 'Member']
                    ]
                ]
            ];
        } elseif ($eventType === 'payment_updated') {
            $templateName = 'payment_confirmation'; // e.g., Hi {{1}}, payment of {{2}} confirmed.
            $components = [
                [
                    'type' => 'body',
                    'parameters' => [
                        ['type' => 'text', 'text' => $booking['full_name'] ?? 'Member'],
                        ['type' => 'text', 'text' => '₹' . ($booking['amount'] ?? '0')]
                    ]
                ]
            ];
        } elseif ($eventType === 'plan_expiring') {
            $templateName = 'plan_expiring_alert'; // e.g., Hi {{1}}, your plan expires on {{2}}.
            $components = [
                [
                    'type' => 'body',
                    'parameters' => [
                        ['type' => 'text', 'text' => $booking['full_name'] ?? 'Member'],
                        ['type' => 'text', 'text' => $booking['expiry_date'] ?? 'soon']
                    ]
                ]
            ];
        }

        try {
            $response = \Illuminate\Support\Facades\Http::withToken($accessToken)
                ->post($url, [
                    'messaging_product' => 'whatsapp',
                    'recipient_type' => 'individual',
                    'to' => $phone,
                    'type' => 'template',
                    'template' => [
                        'name' => $templateName,
                        'language' => [
                            'code' => 'en_US' // Change to your template's language code
                        ],
                        'components' => $components
                    ]
                ]);

            if ($response->successful()) {
                // Deduct 50 paise from wallet
                $gym->wallet_balance -= 0.50;
                $gym->save();

                \App\Models\WalletTransaction::create([
                    'gym_id' => $gym->id,
                    'type' => 'debit',
                    'amount' => 0.50,
                    'balance_after' => $gym->wallet_balance,
                    'description' => "WhatsApp Message Charge ({$eventType})"
                ]);

                \Log::info("[META WHATSAPP] [{$eventType}] Message sent successfully to {$phone}. 0.50 INR deducted.");
            } else {
                \Log::error("[META WHATSAPP] [{$eventType}] Failed to send message: " . $response->body());
            }
        } catch (\Exception $e) {
            \Log::error("[META WHATSAPP] [{$eventType}] Exception: " . $e->getMessage());
        }
    }
}

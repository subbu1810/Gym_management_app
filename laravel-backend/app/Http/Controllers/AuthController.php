<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\GymUser;
use Firebase\JWT\JWT;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Mail\Message;

class AuthController extends Controller
{
    // POST /api/auth/login
    public function adminLogin(Request $request)
    {
        $username = $request->input('username');
        $password = $request->input('password');

        $admin = Admin::where('username', $username)->first();

        if (!$admin) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // Normalize $2b$ (Node.js bcrypt) to $2y$ (PHP bcrypt) before checking
        $hash = str_replace('$2b$', '$2y$', $admin->password_hash);
        if (!password_verify($password, $hash)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        if ($admin->role === 'gym_admin') {
            $gym = \App\Models\Gym::find($admin->gym_id);
            if ($gym && in_array($gym->subscription_status, ['suspended', 'cancelled'])) {
                return response()->json(['message' => 'Your gym account has been deactivated. Please contact the platform provider.'], 403);
            }
        }

        $secret = $this->getJwtSecret();
        $ttl = (int) env('JWT_TTL', 60); // minutes

        $payload = [
            'id'       => $admin->id,
            'username' => $admin->username,
            'role'     => $admin->role,
            'gym_id'   => $admin->gym_id,
            'type'     => 'admin',
            'iat'      => time(),
            'exp'      => time() + ($ttl * 60),
        ];

        $token = JWT::encode($payload, $secret, 'HS256');

        return response()->json([
            'token' => $token, 
            'username' => $admin->username,
            'role' => $admin->role,
            'gym_id' => $admin->gym_id
        ]);
    }

    // POST /api/auth/member-login
    public function memberLogin(Request $request)
    {
        $identifier = $request->input('username') ?? $request->input('phone');
        $password = $request->input('password');

        $user = GymUser::where('username', $identifier)
                       ->orWhere('phone', $identifier)
                       ->first();

        if (!$user) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        if (!Hash::check($password, $user->password_hash)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $secret = $this->getJwtSecret();
        $ttl = (int) env('JWT_TTL', 60); // minutes

        $payload = [
            'id'       => $user->id,
            'username' => $user->username,
            'gym_id'   => $user->gym_id,
            'type'     => 'member',
            'iat'      => time(),
            'exp'      => time() + ($ttl * 60),
        ];

        $token = JWT::encode($payload, $secret, 'HS256');

        return response()->json([
            'token' => $token, 
            'username' => $user->username,
            'type' => 'member',
            'gym_id' => $user->gym_id
        ]);
    }

    // POST /api/auth/trainer-login
    public function trainerLogin(Request $request)
    {
        $identifier = $request->input('email') ?? $request->input('phone');
        $password = $request->input('password');

        $trainer = \App\Models\Trainer::where('email', $identifier)
                                      ->orWhere('phone', $identifier)
                                      ->first();

        if (!$trainer) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        if (!Hash::check($password, $trainer->password_hash)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $trainer->update(['last_login' => now()]);

        $secret = $this->getJwtSecret();
        $ttl = (int) env('JWT_TTL', 60);

        $payload = [
            'id'       => $trainer->id,
            'username' => $trainer->name, // using name as username for UI
            'gym_id'   => $trainer->gym_id,
            'type'     => 'trainer',
            'iat'      => time(),
            'exp'      => time() + ($ttl * 60),
        ];

        $token = JWT::encode($payload, $secret, 'HS256');

        return response()->json([
            'token' => $token, 
            'username' => $trainer->name,
            'type' => 'trainer',
            'gym_id' => $trainer->gym_id
        ]);
    }

    // POST /api/auth/forgot-password/request-otp
    public function requestPasswordResetOtp(Request $request)
    {
        $identifier = $request->input('identifier');

        $admin = Admin::where('email', $identifier)
                      ->orWhere('mobile_number', $identifier)
                      ->first();

        if (!$admin) {
            // Fallback: return first admin (same as Node.js behaviour)
            $admin = Admin::first();
        }

        if (!$admin) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $otp    = (string) random_int(100000, 999999);
        $expiry = now()->addMinutes(10);

        $admin->update(['reset_otp' => $otp, 'reset_otp_expiry' => $expiry]);

        // Attempt to send email
        try {
            $html = '
                <div style="font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif; max-width: 600px; margin: 0 auto; background-color: #f6f8fa; padding: 40px 20px; text-align: center;">
                    <div style="background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(27,31,35,0.12);">
                        <h1 style="color: #24292e; font-size: 24px; margin-bottom: 24px; font-weight: 500;">Reset your GYM Admin password</h1>
                        <p style="color: #586069; font-size: 16px; margin-bottom: 24px; line-height: 1.5;">
                            We received a request to reset your admin password. Please use the following One-Time Password (OTP) to complete the process:
                        </p>
                        <div style="background-color: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
                            <h2 style="margin: 0; font-size: 36px; letter-spacing: 6px; color: #24292e;">' . $otp . '</h2>
                        </div>
                        <p style="color: #586069; font-size: 14px; margin-bottom: 0; line-height: 1.5;">
                            This OTP is valid for 10 minutes.<br>
                            If you did not request this, please ignore this email.
                        </p>
                    </div>
                </div>
            ';

            Mail::send([], [], function (Message $message) use ($identifier, $html) {
                $message->to($identifier)
                        ->subject('GYM Booking Admin - Password Reset')
                        ->setBody($html, 'text/html');
            });

            \Log::info("[Email] OTP sent to {$identifier}");
        } catch (\Exception $e) {
            \Log::warning("[Email Mock Fallback] OTP for {$identifier} is {$otp}");
            \Log::error('(Email sending failed: ' . $e->getMessage() . ')');
        }

        return response()->json(['message' => 'OTP sent successfully']);
    }

    // POST /api/auth/forgot-password/verify-otp
    public function verifyPasswordResetOtp(Request $request)
    {
        $identifier = $request->input('identifier');
        $otp        = $request->input('otp');

        $admin = Admin::where('email', $identifier)
                      ->orWhere('mobile_number', $identifier)
                      ->first() ?? Admin::first();

        if (!$admin) {
            return response()->json(['message' => 'User not found'], 404);
        }

        if ($admin->reset_otp !== $otp) {
            return response()->json(['message' => 'Invalid OTP'], 400);
        }

        if (now()->greaterThan($admin->reset_otp_expiry)) {
            return response()->json(['message' => 'OTP has expired'], 400);
        }

        return response()->json(['message' => 'OTP verified successfully']);
    }

    // POST /api/auth/forgot-password/reset
    public function resetAdminPassword(Request $request)
    {
        $identifier  = $request->input('identifier');
        $otp         = $request->input('otp');
        $newPassword = $request->input('newPassword');

        $admin = Admin::where('email', $identifier)
                      ->orWhere('mobile_number', $identifier)
                      ->first() ?? Admin::first();

        if (!$admin || $admin->reset_otp !== $otp) {
            return response()->json(['message' => 'Invalid request or OTP'], 400);
        }

        if (now()->greaterThan($admin->reset_otp_expiry)) {
            return response()->json(['message' => 'OTP has expired'], 400);
        }

        if (strlen($newPassword) < 6) {
            return response()->json(['message' => 'Password must be at least 6 characters'], 400);
        }

        $admin->update([
            'password_hash'    => Hash::make($newPassword),
            'reset_otp'        => null,
            'reset_otp_expiry' => null,
        ]);

        return response()->json(['message' => 'Password reset successful']);
    }

    /**
     * Get JWT secret padded to at least 32 chars (firebase/php-jwt requirement).
     */
    private function getJwtSecret(): string
    {
        $raw = env('JWT_SECRET', 'your_super_secret_key_gym_booking_app');
        return str_pad($raw, 32, '0');
    }
}

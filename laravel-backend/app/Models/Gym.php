<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Gym extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'subscription_status',
        'subscription_ends_at',
        'subscription_plan',
        'currency',
        'date_format',
        'time_format',
        'timezone',
        'language',
        'logo_path',
        'notification_settings',
        'razorpay_key_id',
        'razorpay_key_secret',
        'enable_online_payment',
        'enable_cash',
        'enable_upi',
        'upi_id',
        'enable_bank_transfer',
        'enable_card',
        'tax_name',
        'tax_rate',
        'tax_registration_no',
        'tax_calculation_type',
        'enable_tax',
        'twilio_sid',
        'twilio_auth_token',
        'twilio_phone_number',
        'enable_sms',
        'enable_whatsapp',
        'smtp_host',
        'smtp_port',
        'smtp_username',
        'smtp_password',
        'smtp_sender_email',
        'smtp_sender_name',
        'smtp_encryption',
        'enable_smtp',
        'whatsapp_access_token',
        'whatsapp_phone_number_id',
        'whatsapp_business_account_id',
        'enable_whatsapp_meta',
        'whatsapp_notify_new_customer',
        'whatsapp_notify_payment_updated',
        'whatsapp_notify_plan_expiring',
        'wallet_balance'
    ];

    protected $casts = [
        'subscription_ends_at' => 'datetime',
        'notification_settings' => 'array',
        'enable_online_payment' => 'boolean',
        'enable_cash' => 'boolean',
        'enable_upi' => 'boolean',
        'enable_bank_transfer' => 'boolean',
        'enable_card' => 'boolean',
        'tax_rate' => 'float',
        'enable_tax' => 'boolean',
        'enable_sms' => 'boolean',
        'enable_whatsapp' => 'boolean',
        'enable_smtp' => 'boolean',
        'enable_whatsapp_meta' => 'boolean',
    ];

    public function admins()
    {
        return $this->hasMany(Admin::class);
    }

    public function members()
    {
        return $this->hasMany(GymUser::class, 'gym_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use Exception;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JwtMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $authHeader = $request->header('Authorization');
        $token = null;

        if ($authHeader) {
            $token = str_replace('Bearer ', '', $authHeader);
        } elseif ($request->query('token')) {
            $token = $request->query('token');
        }

        if (!$token) {
            return response()->json(['message' => 'No token, authorization denied'], 401);
        }

        try {
            $raw    = env('JWT_SECRET', 'your_super_secret_key_gym_booking_app');
            $secret = str_pad($raw, 32, '0');
            $decoded = JWT::decode($token, new Key($secret, 'HS256'));
            $request->attributes->set('auth_user', (array) $decoded);
        } catch (Exception $e) {
            return response()->json(['message' => 'Token is not valid'], 401);
        }

        return $next($request);
    }
}

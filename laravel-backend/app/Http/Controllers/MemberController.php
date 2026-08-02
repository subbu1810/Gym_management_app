<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\GymUser;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class MemberController extends Controller
{
    public function index(Request $request)
    {
        $authUser = $request->attributes->get('auth_user');
        $gymId = $authUser['gym_id'] ?? null;
        $role = $authUser['role'] ?? 'gym_admin';

        $query = DB::table('users as u')
            ->leftJoin('payments as p', 'u.id', '=', 'p.user_id')
            ->leftJoin('trainers as t', 'u.trainer_id', '=', 't.id')
            ->select('u.*', 'p.amount', 'p.payment_status', 'p.transaction_id', 'p.currency', 't.name as trainer_name')
            ->orderBy('u.id', 'desc');

        if ($role !== 'super_admin' && $gymId) {
            $query->where('u.gym_id', $gymId);
        }

        if ($request->has('name') && $request->name != '') {
            $query->where(function($q) use ($request) {
                $q->where('u.full_name', 'like', '%' . $request->name . '%')
                  ->orWhere('u.firstName', 'like', '%' . $request->name . '%');
            });
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->all();
        try {
            DB::beginTransaction();

            $username = $data['username'] ?? strtolower(str_replace(' ', '', $data['full_name'] ?? 'member')) . rand(100, 999);
            $password = $data['password'] ?? 'default123';
            $data['username'] = $username;
            $data['password_hash'] = Hash::make($password);
            $data['join_date'] = $data['join_date'] ?? $data['booking_date'] ?? date('Y-m-d');
            $data['gym_id'] = $data['gym_id'] ?? 1;
            
            if (isset($data['terms_accepted'])) {
                $data['terms_accepted'] = filter_var($data['terms_accepted'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
            }

            // Handle optional trainer_id (set to null if empty string)
            if (empty($data['trainer_id'])) {
                $data['trainer_id'] = null;
            }

            if (isset($data['profilePhoto']) && strpos($data['profilePhoto'], 'data:image') === 0) {
                $imageParts = explode(';base64,', $data['profilePhoto']);
                if (count($imageParts) == 2) {
                    $imageTypeAux = explode('image/', $imageParts[0]);
                    $imageType = rtrim($imageTypeAux[1], ';');
                    $imageBase64 = base64_decode($imageParts[1]);
                    $fileName = 'members/photos/' . uniqid() . '.' . $imageType;
                    \Illuminate\Support\Facades\Storage::disk('public')->put($fileName, $imageBase64);
                    $data['profilePhoto'] = asset('storage/' . $fileName);
                }
            } elseif (isset($data['profilePhoto']) && empty($data['profilePhoto'])) {
                unset($data['profilePhoto']);
            }

            if (isset($data['idProofPhoto']) && strpos($data['idProofPhoto'], 'data:image') === 0) {
                $imageParts = explode(';base64,', $data['idProofPhoto']);
                if (count($imageParts) == 2) {
                    $imageTypeAux = explode('image/', $imageParts[0]);
                    $imageType = rtrim($imageTypeAux[1], ';');
                    $imageBase64 = base64_decode($imageParts[1]);
                    $fileName = 'members/id_proofs/' . uniqid() . '.' . $imageType;
                    \Illuminate\Support\Facades\Storage::disk('public')->put($fileName, $imageBase64);
                    $data['idProofPhoto'] = asset('storage/' . $fileName);
                }
            } elseif (isset($data['idProofPhoto']) && empty($data['idProofPhoto'])) {
                unset($data['idProofPhoto']);
            }

            $user = GymUser::create($data);

            Payment::create([
                'gym_id'         => $data['gym_id'],
                'user_id'        => $user->id,
                'amount'         => $data['amount'] ?? 0,
                'payment_status' => $data['payment_status'] ?? 'Pending',
            ]);

            DB::commit();
            return response()->json(['message' => 'Member created successfully', 'member' => $user], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Create member error: ' . $e->getMessage());
            return response()->json(['message' => 'Server error', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $data = $request->all();
            
            DB::beginTransaction();
            $user = GymUser::find($id);
            if (!$user) return response()->json(['message' => 'Member not found'], 404);

            if (empty($data['trainer_id'])) {
                $data['trainer_id'] = null;
            }

            if (isset($data['terms_accepted'])) {
                $data['terms_accepted'] = filter_var($data['terms_accepted'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
            }

            if (isset($data['profilePhoto']) && strpos($data['profilePhoto'], 'data:image') === 0) {
                $imageParts = explode(';base64,', $data['profilePhoto']);
                if (count($imageParts) == 2) {
                    $imageTypeAux = explode('image/', $imageParts[0]);
                    $imageType = rtrim($imageTypeAux[1], ';');
                    $imageBase64 = base64_decode($imageParts[1]);
                    $fileName = 'members/photos/' . uniqid() . '.' . $imageType;
                    \Illuminate\Support\Facades\Storage::disk('public')->put($fileName, $imageBase64);
                    $data['profilePhoto'] = asset('storage/' . $fileName);
                }
            } elseif (isset($data['profilePhoto']) && empty($data['profilePhoto'])) {
                unset($data['profilePhoto']);
            }

            if (isset($data['idProofPhoto']) && strpos($data['idProofPhoto'], 'data:image') === 0) {
                $imageParts = explode(';base64,', $data['idProofPhoto']);
                if (count($imageParts) == 2) {
                    $imageTypeAux = explode('image/', $imageParts[0]);
                    $imageType = rtrim($imageTypeAux[1], ';');
                    $imageBase64 = base64_decode($imageParts[1]);
                    $fileName = 'members/id_proofs/' . uniqid() . '.' . $imageType;
                    \Illuminate\Support\Facades\Storage::disk('public')->put($fileName, $imageBase64);
                    $data['idProofPhoto'] = asset('storage/' . $fileName);
                }
            } elseif (isset($data['idProofPhoto']) && empty($data['idProofPhoto'])) {
                unset($data['idProofPhoto']);
            }

            $user->update($data);

            if (isset($data['amount']) || isset($data['payment_status'])) {
                $paymentData = [
                    'amount' => $data['amount'] ?? 0,
                    'payment_status' => $data['payment_status'] ?? 'Pending'
                ];
                $payment = Payment::where('user_id', $id)->first();
                if ($payment) {
                    $payment->update($paymentData);
                } else {
                    Payment::create(array_merge($paymentData, ['gym_id' => $user->gym_id, 'user_id' => $id]));
                }
            }

            DB::commit();
            return response()->json(['message' => 'Member updated successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Update member error: ' . $e->getMessage());
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $user = GymUser::find($id);
            if (!$user) return response()->json(['message' => 'Member not found'], 404);
            $user->delete();
            return response()->json(['message' => 'Member deleted successfully']);
        } catch (\Exception $e) {
            \Log::error('Delete member error: ' . $e->getMessage());
            return response()->json(['message' => 'Server error'], 500);
        }
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use App\Models\User;

class DashboardController extends Controller
{
    public function index(Request $request) {
        return Inertia::render('Dashboard', [
            'message' => 'Hi from Controller via Inertia!'
        ]);
    }
}
<?php

namespace App\Models;

use MongoDB\Laravel\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use Notifiable, HasApiTokens;

    protected $connection = 'mongodb';
    protected $collection = 'users';

    protected $fillable=[
        'name', 'mobile', 'otp', 'otp_expires_at'
    ];

    protected $hidden = ['otp'];
}

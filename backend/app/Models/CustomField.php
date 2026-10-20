<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomField extends Model
{
    public $timestamps = false;

    protected $fillable = ['position', 'label', 'value', 'visible'];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'visible' => 'boolean',
        ];
    }
}

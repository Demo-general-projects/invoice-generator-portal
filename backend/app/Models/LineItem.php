<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LineItem extends Model
{
    public $timestamps = false;

    protected $fillable = ['position', 'description', 'quantity_hundredths', 'unit_price_cents'];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'quantity_hundredths' => 'integer',
            'unit_price_cents' => 'integer',
        ];
    }
}

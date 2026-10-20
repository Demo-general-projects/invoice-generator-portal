<?php

namespace App\Mail;

use RuntimeException;

class EmailNotConfigured extends RuntimeException
{
    /**
     * Credentials are read from the server's .env only and never reach the
     * browser. Throws unless a real mailer and a sender address are set.
     */
    public static function check(): void
    {
        $mailer = config('mail.default');
        $missing = match ($mailer) {
            'log', 'array', null => ['MAIL_MAILER'],
            'smtp' => array_keys(array_filter([
                'MAIL_HOST' => config('mail.mailers.smtp.host'),
                'MAIL_USERNAME' => config('mail.mailers.smtp.username'),
                'MAIL_PASSWORD' => config('mail.mailers.smtp.password'),
            ], fn ($value) => blank($value))),
            default => [],
        };
        if (! filter_var(config('mail.from.address'), FILTER_VALIDATE_EMAIL)) {
            $missing[] = 'MAIL_FROM_ADDRESS';
        }

        if ($missing !== []) {
            throw new self("Email isn't configured on the server. Set ".implode(', ', $missing).' in .env (see README).');
        }
    }
}

<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;

#[Signature('frontend:build {--path=../frontend : The Next.js frontend project} {--skip-install : Reuse the existing node_modules}')]
#[Description('Build the Next.js frontend as static files and copy them into public/app')]
class BuildFrontend extends Command
{
    public function handle(): int
    {
        $frontend = realpath(base_path($this->option('path')));
        if ($frontend === false || ! is_file("{$frontend}/package.json")) {
            $this->error("No frontend project found at {$this->option('path')}.");

            return self::FAILURE;
        }

        $steps = $this->option('skip-install') ? ['npm run build'] : ['npm ci', 'npm run build'];
        foreach ($steps as $step) {
            $this->components->info("{$step} (in {$frontend})");
            $result = Process::path($frontend)->forever()->run($step, fn (string $type, string $output) => $this->output->write($output));
            if ($result->failed()) {
                $this->error("\"{$step}\" failed.");

                return self::FAILURE;
            }
        }

        $target = public_path('app');
        File::deleteDirectory($target);
        File::copyDirectory("{$frontend}/out", $target);
        $this->components->info("Frontend copied to {$target}. Open ".rtrim(config('app.url'), '/').'/');

        return self::SUCCESS;
    }
}

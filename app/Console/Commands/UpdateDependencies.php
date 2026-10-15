<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\ExecutableFinder;

class UpdateDependencies extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'dependencies:update';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Обновление PHP и npm зависимостей';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('📦 Updating dependencies...');

        // Update Composer dependencies
        $this->info('🔄 Updating Composer dependencies...');
        $composer = (new ExecutableFinder())->find('composer');
        
        $process = Process::fromShellCommandline(
            sprintf('%s install --no-interaction --optimize-autoloader --no-dev', $composer)
        );
        
        $process->setTimeout(3600);
        $process->run(function ($type, $buffer) {
            $this->output->write($buffer);
        });

        if (!$process->isSuccessful()) {
            $this->error('❌ Error updating Composer dependencies');
            return 1;
        }

        $this->info('✅ Composer dependencies updated');

        // Update NPM dependencies
        $this->info('🔄 Updating NPM dependencies...');
        $node = (new ExecutableFinder())->find('node');
        $npm = (new ExecutableFinder())->find('npm');

        $process = Process::fromShellCommandline(
            sprintf('%s %s install', $node, $npm)
        );
        
        $process->setTimeout(3600);
        $process->run(function ($type, $buffer) {
            $this->output->write($buffer);
        });

        if (!$process->isSuccessful()) {
            $this->error('❌ Error updating NPM dependencies');
            return 1;
        }

        $this->info('✅ NPM dependencies updated');
        $this->info('✅ All dependencies updated successfully');

        return 0;
    }
}

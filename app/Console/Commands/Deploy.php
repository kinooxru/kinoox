<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;

class Deploy extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'deploy';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Команда для деплоя приложения на продакшен';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Starting deployment...');

        // 1. Clear cache
        $this->info('🧹 Clearing cache...');
        Artisan::call('cache:clear');
        Artisan::call('config:clear');
        Artisan::call('route:clear');
        Artisan::call('view:clear');
        $this->info('✅ Cache cleared');

        // 2. Update dependencies
        $this->info('📦 Updating dependencies...');
        $this->call('dependencies:update');
        
        // 3. Run migrations
        if ($this->confirm('Run database migrations?', true)) {
            $this->info('🗄 Running migrations...');
            Artisan::call('migrate', ['--force' => true]);
            $this->info('✅ Migrations completed');
        }

        // 4. Optimize
        $this->info('⚡ Optimizing application...');
        Artisan::call('optimize');
        $this->info('✅ Optimization completed');

        // 5. Recreate symbolic link for storage
        if ($this->confirm('Recreate storage symbolic link?', true)) {
            Artisan::call('storage:link');
            $this->info('✅ Storage link recreated');
        }

        $this->info('✅ Deployment completed successfully!');
    }
}

<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

class MigrateOldData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate:old-data';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Миграция данных из старой базы данных KINOOX';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Starting data migration...');

        $this->call('db:seed', [
            '--class' => MigrateOldDataSeeder::class
        ]);

        $this->info('✅ Migration completed!');
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('app_versions', function (Blueprint $table) {
            $table->id();
            $table->string('platform'); // android, ios, windows, macos, linux
            $table->string('version');
            $table->string('download_url');
            $table->text('changelog')->nullable();
            $table->boolean('is_latest')->default(false);
            $table->integer('download_count')->default(0);
            $table->timestamps();

            $table->unique(['platform', 'version']);
        });

        Schema::create('sync_logs', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['full', 'batch', 'single', 'kp_import']);
            $table->enum('balancer', ['vibix', 'veoveo'])->nullable();
            $table->integer('titles_processed')->default(0);
            $table->integer('titles_success')->default(0);
            $table->integer('titles_failed')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index('created_at');
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sync_logs');
        Schema::dropIfExists('app_versions');
    }
};

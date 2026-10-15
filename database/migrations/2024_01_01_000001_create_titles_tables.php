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
        Schema::create('titles', function (Blueprint $table) {
            $table->id();
            $table->integer('kp_id')->unique()->nullable();
            $table->string('imdb_id')->nullable();
            $table->enum('type', ['movie', 'serial', 'cartoon', 'anime']);
            $table->string('title');
            $table->string('original_title')->nullable();
            $table->text('description')->nullable();
            $table->string('poster_url')->nullable();
            $table->string('backdrop_url')->nullable();
            $table->year('year')->nullable();
            $table->decimal('rating_kp', 4, 2)->nullable();
            $table->decimal('rating_imdb', 4, 2)->nullable();
            $table->integer('duration')->nullable(); // minutes
            $table->json('countries')->nullable();
            $table->json('genres')->nullable();
            $table->json('actors')->nullable();
            $table->json('directors')->nullable();
            $table->enum('status', ['ongoing', 'released', 'announced'])->default('released');
            $table->integer('views_count')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index('type');
            $table->index('year');
            $table->index('rating_kp');
            $table->index('status');
            $table->fullText(['title', 'description']);
        });

        Schema::create('episodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('title_id')->constrained('titles')->onDelete('cascade');
            $table->integer('season_number')->default(1);
            $table->integer('episode_number');
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->integer('duration')->nullable(); // minutes
            $table->string('poster_url')->nullable();
            $table->string('source_url')->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();

            $table->index(['title_id', 'season_number', 'episode_number']);
        });

        Schema::create('sources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('title_id')->constrained('titles')->onDelete('cascade');
            $table->foreignId('episode_id')->nullable()->constrained('episodes')->onDelete('cascade');
            $table->enum('balancer', ['vibix', 'veoveo']);
            $table->string('source_url');
            $table->string('embed_url')->nullable();
            $table->integer('priority')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['title_id', 'balancer']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sources');
        Schema::dropIfExists('episodes');
        Schema::dropIfExists('titles');
    }
};

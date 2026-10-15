<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

class MigrateOldDataSeeder extends Seeder
{
    /**
     * Run the database migrations.
     *
     * Этот seeder копирует данные из старой структуры базы данных
     * в новую структуру Laravel приложения.
     */
    public function run(): void
    {
        echo "\n🔄 Starting data migration from old database...\n\n";

        // Настраиваем подключение к старой базе данных
        $oldConnection = [
            'driver' => 'pgsql',
            'host' => env('OLD_DB_HOST', 'localhost'),
            'port' => env('OLD_DB_PORT', '5432'),
            'database' => env('OLD_DB_DATABASE', 'kinoox_old'),
            'username' => env('OLD_DB_USERNAME', 'kinoox'),
            'password' => env('OLD_DB_PASSWORD', 'kinoox_password'),
            'charset' => 'utf8',
            'prefix' => '',
            'prefix_indexes' => true,
            'sslmode' => 'prefer',
        ];

        // Добавляем старое подключение
        Config::set('database.connections.old_db', $oldConnection);
        DB::setDefaultConnection('old_db');

        try {
            // Проверяем подключение
            DB::connection()->getPdo();
            echo "✅ Connected to old database\n";
        } catch (\Exception $e) {
            echo "❌ Cannot connect to old database: " . $e->getMessage() . "\n";
            echo "⚠️  Skipping migration...\n";
            return;
        }

        // Переключаемся на новую базу
        DB::setDefaultConnection('pgsql');

        // Миграция пользователей
        echo "\n📦 Migrating users...\n";
        $oldUsers = DB::connection('old_db')->table('users')->get();
        $userCount = 0;

        foreach ($oldUsers as $oldUser) {
            // Проверяем, есть ли уже пользователь
            $exists = DB::table('users')->where('email', $oldUser->email)->exists();
            
            if (!$exists) {
                DB::table('users')->insert([
                    'email' => $oldUser->email,
                    'username' => $oldUser->username ?? $oldUser->email,
                    'password' => $oldUser->password_hash ?? $oldUser->password,
                    'avatar_url' => $oldUser->avatar_url ?? $oldUser->avatar,
                    'role' => $oldUser->is_admin ? 'admin' : 'user',
                    'created_at' => $oldUser->created_at,
                    'updated_at' => $oldUser->updated_at,
                ]);
                $userCount++;
            }
        }

        echo "✅ Migrated {$userCount} users\n";

        // Миграция фильмов
        echo "\n📦 Migrating titles...\n";
        $oldTitles = DB::connection('old_db')->table('titles')->get();
        $titleCount = 0;

        foreach ($oldTitles as $oldTitle) {
            $exists = DB::table('titles')->where('kp_id', $oldTitle->kp_id)->exists();
            
            if (!$exists) {
                // Преобразуем JSON поля
                $countries = is_string($oldTitle->countries) 
                    ? json_decode($oldTitle->countries, true) 
                    : [$oldTitle->country];
                
                $genres = is_string($oldTitle->genres) 
                    ? json_decode($oldTitle->genres, true) 
                    : [$oldTitle->genre];

                DB::table('titles')->insert([
                    'kp_id' => $oldTitle->kp_id,
                    'imdb_id' => $oldTitle->imdb_id,
                    'type' => $oldTitle->type,
                    'title' => $oldTitle->title,
                    'original_title' => $oldTitle->original_title,
                    'description' => $oldTitle->description,
                    'poster_url' => $oldTitle->poster_url,
                    'backdrop_url' => $oldTitle->backdrop_url,
                    'year' => $oldTitle->year,
                    'rating_kp' => $oldTitle->rating_kp,
                    'rating_imdb' => $oldTitle->rating_imdb,
                    'duration' => $oldTitle->duration_minutes,
                    'countries' => json_encode($countries),
                    'genres' => json_encode($genres),
                    'actors' => json_encode([]), // Требует преобразования
                    'directors' => json_encode([]), // Требует преобразования
                    'status' => $oldTitle->status ?? 'released',
                    'views_count' => $oldTitle->views_count ?? 0,
                    'created_at' => $oldTitle->created_at,
                    'updated_at' => $oldTitle->updated_at,
                ]);
                $titleCount++;
            }
        }

        echo "✅ Migrated {$titleCount} titles\n";

        // Миграция эпизодов
        echo "\n📦 Migrating episodes...\n";
        $oldEpisodes = DB::connection('old_db')->table('episodes')->get();
        $episodeCount = 0;

        foreach ($oldEpisodes as $oldEpisode) {
            $exists = DB::table('episodes')
                ->where('title_id', $oldEpisode->title_id)
                ->where('number', $oldEpisode->number)
                ->exists();
            
            if (!$exists) {
                DB::table('episodes')->insert([
                    'title_id' => $oldEpisode->title_id,
                    'number' => $oldEpisode->number,
                    'description' => $oldEpisode->description,
                    'date' => $oldEpisode->air_date ?? $oldEpisode->created_at,
                    'created_at' => $oldEpisode->created_at,
                    'updated_at' => $oldEpisode->updated_at,
                ]);
                $episodeCount++;
            }
        }

        echo "✅ Migrated {$episodeCount} episodes\n";

        // Миграция источников
        echo "\n📦 Migrating sources...\n";
        $oldSources = DB::connection('old_db')->table('sources')->get();
        $sourceCount = 0;

        foreach ($oldSources as $oldSource) {
            $exists = DB::table('sources')
                ->where('episode_id', $oldSource->episode_id)
                ->where('name', $oldSource->name)
                ->exists();
            
            if (!$exists) {
                DB::table('sources')->insert([
                    'episode_id' => $oldSource->episode_id,
                    'name' => $oldSource->name,
                    'class' => $oldSource->player_class,
                    'website' => $oldSource->website,
                    'episode_number' => $oldSource->episode_number,
                    'created_at' => $oldSource->created_at,
                    'updated_at' => $oldSource->updated_at,
                ]);
                $sourceCount++;
            }
        }

        echo "✅ Migrated {$sourceCount} sources\n";

        // Миграция закладок
        echo "\n📦 Migrating bookmarks...\n";
        $oldBookmarks = DB::connection('old_db')->table('bookmarks')->get();
        $bookmarkCount = 0;

        foreach ($oldBookmarks as $oldBookmark) {
            $exists = DB::table('bookmarks')
                ->where('user_id', $oldBookmark->user_id)
                ->where('title_id', $oldBookmark->title_id)
                ->exists();
            
            if (!$exists) {
                DB::table('bookmarks')->insert([
                    'user_id' => $oldBookmark->user_id,
                    'title_id' => $oldBookmark->title_id,
                    'source_id' => $oldBookmark->source_id,
                    'time' => $oldBookmark->watch_time ?? $oldBookmark->time,
                    'created_at' => $oldBookmark->created_at,
                    'updated_at' => $oldBookmark->updated_at,
                ]);
                $bookmarkCount++;
            }
        }

        echo "✅ Migrated {$bookmarkCount} bookmarks\n";

        // Миграция комментариев
        echo "\n📦 Migrating comments...\n";
        $oldComments = DB::connection('old_db')->table('comments')->get();
        $commentCount = 0;

        foreach ($oldComments as $oldComment) {
            $exists = DB::table('comments')->where('id', $oldComment->id)->exists();
            
            if (!$exists) {
                DB::table('comments')->insert([
                    'user_id' => $oldComment->user_id,
                    'title_id' => $oldComment->title_id,
                    'source_id' => $oldComment->source_id,
                    'text' => $oldComment->text,
                    'time' => $oldComment->created_at,
                    'created_at' => $oldComment->created_at,
                    'updated_at' => $oldComment->updated_at,
                ]);
                $commentCount++;
            }
        }

        echo "✅ Migrated {$commentCount} comments\n";

        // Миграция истории просмотров
        echo "\n📦 Migrating view history...\n";
        $oldHistory = DB::connection('old_db')->table('view_history')->get();
        $historyCount = 0;

        foreach ($oldHistory as $oldItem) {
            $exists = DB::table('view_history')
                ->where('user_id', $oldItem->user_id)
                ->where('title_id', $oldItem->title_id)
                ->where('source_id', $oldItem->source_id)
                ->exists();
            
            if (!$exists) {
                DB::table('view_history')->insert([
                    'user_id' => $oldItem->user_id,
                    'title_id' => $oldItem->title_id,
                    'source_id' => $oldItem->source_id,
                    'time' => $oldItem->created_at,
                    'created_at' => $oldItem->created_at,
                    'updated_at' => $oldItem->updated_at,
                ]);
                $historyCount++;
            }
        }

        echo "✅ Migrated {$historyCount} view history records\n";

        echo "\n✅ Data migration completed!\n";
        echo "================================\n";
    }
}

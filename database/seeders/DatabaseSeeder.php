<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Title;
use App\Models\Episode;
use App\Models\Source;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Создаем тестового пользователя
        User::create([
            'email' => 'test@example.com',
            'username' => 'testuser',
            'password' => bcrypt('password'),
            'role' => 'user',
            'avatar_url' => null,
        ]);

        // Создаем администратора
        User::create([
            'email' => 'admin@kinoox.com',
            'username' => 'admin',
            'password' => bcrypt('admin123'),
            'role' => 'admin',
            'avatar_url' => null,
        ]);

        // Создаем примеры фильмов
        $this->seedTitles();
    }

    protected function seedTitles(): void
    {
        $titles = [
            [
                'kp_id' => 123456,
                'imdb_id' => 'tt1234567',
                'type' => 'movie',
                'title' => 'Безымянный фильм',
                'original_title' => 'Untitled Movie',
                'description' => 'Это пример описания фильма для тестирования функциональности KINOOX.',
                'poster_url' => null,
                'backdrop_url' => null,
                'year' => 2024,
                'rating_kp' => 8.5,
                'rating_imdb' => 7.9,
                'duration' => 120,
                'countries' => ['США', 'Канада'],
                'genres' => ['Боевик', 'Триллер'],
                'actors' => ['Актер 1', 'Актер 2', 'Актер 3'],
                'directors' => 'Режиссер 1',
                'status' => 'released',
                'views_count' => 15420,
            ],
            [
                'kp_id' => 123457,
                'imdb_id' => 'tt1234568',
                'type' => 'serial',
                'title' => 'Телесериал',
                'original_title' => 'TV Series',
                'description' => 'Описание популярного телесериала.',
                'poster_url' => null,
                'backdrop_url' => null,
                'year' => 2023,
                'rating_kp' => 9.1,
                'rating_imdb' => 8.7,
                'duration' => null,
                'countries' => ['Южная Корея'],
                'genres' => ['Драма', 'Триллер'],
                'actors' => ['Актер 4', 'Актер 5'],
                'directors' => 'Режиссер 2',
                'status' => 'ongoing',
                'views_count' => 32100,
            ],
            [
                'kp_id' => 123458,
                'imdb_id' => 'tt1234569',
                'type' => 'cartoon',
                'title' => 'Мультфильм',
                'original_title' => 'Cartoon',
                'description' => 'Веселый мультфильм для всей семьи.',
                'poster_url' => null,
                'backdrop_url' => null,
                'year' => 2024,
                'rating_kp' => 7.8,
                'rating_imdb' => 7.2,
                'duration' => 95,
                'countries' => ['США'],
                'genres' => ['Мультфильм', 'Комедия'],
                'actors' => [],
                'directors' => 'Режиссер 3',
                'status' => 'released',
                'views_count' => 8900,
            ],
            [
                'kp_id' => 123459,
                'imdb_id' => 'tt1234570',
                'type' => 'anime',
                'title' => 'Аниме',
                'original_title' => 'Anime',
                'description' => 'Популярное аниме для подростков.',
                'poster_url' => null,
                'backdrop_url' => null,
                'year' => 2024,
                'rating_kp' => 8.9,
                'rating_imdb' => 8.4,
                'duration' => null,
                'countries' => ['Япония'],
                'genres' => ['Аниме', 'Фэнтези'],
                'actors' => [],
                'directors' => 'Режиссер 4',
                'status' => 'ongoing',
                'views_count' => 45600,
            ],
        ];

        foreach ($titles as $titleData) {
            $title = Title::create($titleData);

            // Создаем эпизоды для сериалов и аниме
            if (in_array($title->type, ['serial', 'anime'])) {
                $episode = Episode::create([
                    'title_id' => $title->id,
                    'number' => 1,
                    'description' => 'Первый эпизод.',
                    'date' => now(),
                ]);

                Source::create([
                    'episode_id' => $episode->id,
                    'name' => 'vibix',
                    'class' => 'player1',
                    'website' => 'vibix.com',
                    'episode_number' => 1,
                ]);

                Source::create([
                    'episode_id' => $episode->id,
                    'name' => 'veoveo',
                    'class' => 'player2',
                    'website' => 'veoveo.com',
                    'episode_number' => 1,
                ]);
            }
        }
    }
}

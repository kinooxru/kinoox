<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Здесь определены веб-маршруты для приложения KINOOX.
| Эти маршруты используются фронтендом на Vue 3 + Inertia.js
|
*/

Route::get('/', function () {
    return Inertia::render('Home', [
        'title' => 'Главная',
    ]);
});

Route::get('/titles', function () {
    return Inertia::render('Titles', [
        'title' => 'Каталог',
    ]);
});

Route::get('/titles/{id}', function ($id) {
    return Inertia::render('TitleDetail', [
        'title' => 'Просмотр фильма',
        'titleId' => $id,
    ]);
});

Route::get('/bookmarks', function () {
    return Inertia::render('Bookmarks', [
        'title' => 'Закладки',
    ]);
});

Route::get('/search', function () {
    return Inertia::render('Search', [
        'title' => 'Поиск',
    ]);
});

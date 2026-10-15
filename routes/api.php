<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TitleController;
use App\Http\Controllers\Api\BookmarkController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\PlayerController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Здесь определены API маршруты для приложения KINOOX.
| Все маршруты начинаются с префикса 'api/v1'
|
*/

// Auth Routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    // User
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Bookmarks
    Route::get('/bookmarks', [BookmarkController::class, 'index']);
    Route::post('/bookmarks', [BookmarkController::class, 'store']);
    Route::delete('/bookmarks/{id}', [BookmarkController::class, 'destroy']);
    Route::get('/bookmarks/check/{titleId}', [BookmarkController::class, 'check']);

    // Comments
    Route::get('/titles/{titleId}/comments', [CommentController::class, 'index']);
    Route::post('/comments', [CommentController::class, 'store']);
    Route::put('/comments/{id}', [CommentController::class, 'update']);
    Route::delete('/comments/{id}', [CommentController::class, 'destroy']);

    // Player
    Route::post('/players/progress', [PlayerController::class, 'saveProgress']);
    Route::get('/sources/{sourceId}', [PlayerController::class, 'getSource']);
    Route::get('/episodes/{episodeId}', [PlayerController::class, 'getEpisode']);

    // Sync
    Route::post('/sync', function (Request $request) {
        // Логика синхронизации данных пользователя
        return response()->json(['message' => 'Sync endpoint']);
    });
});

// Public Routes
Route::get('/titles', [TitleController::class, 'index']);
Route::get('/titles/popular', [TitleController::class, 'popular']);
Route::get('/titles/{title}', [TitleController::class, 'show']);
Route::get('/titles/{title}/episodes', [TitleController::class, 'showWithEpisodes']);
Route::get('/titles/{titleId}/comments', [CommentController::class, 'index']);

// Search
Route::get('/search', [SearchController::class, 'index']);
Route::get('/search/popular', [SearchController::class, 'popular']);

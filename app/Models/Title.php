<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Title extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'kp_id',
        'imdb_id',
        'type',
        'title',
        'original_title',
        'description',
        'poster_url',
        'backdrop_url',
        'year',
        'rating_kp',
        'rating_imdb',
        'duration',
        'countries',
        'genres',
        'actors',
        'directors',
        'status',
        'views_count',
    ];

    protected $casts = [
        'countries' => 'array',
        'genres' => 'array',
        'actors' => 'array',
        'directors' => 'array',
        'rating_kp' => 'decimal:2',
        'rating_imdb' => 'decimal:2',
    ];

    public function episodes(): HasMany
    {
        return $this->hasMany(Episode::class);
    }

    public function sources(): HasMany
    {
        return $this->hasMany(Source::class);
    }

    public function bookmarks(): HasMany
    {
        return $this->hasMany(Bookmark::class);
    }

    public function viewHistory(): HasMany
    {
        return $this->hasMany(ViewHistory::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function incrementViews(): void
    {
        $this->increment('views_count');
    }
}

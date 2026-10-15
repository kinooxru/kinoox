<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Title;
use App\Models\Episode;
use App\Models\Source;
use Illuminate\Http\Request;

class TitleController extends Controller
{
    public function index(Request $request)
    {
        $query = Title::query();

        // Фильтрация по типу
        if ($request->has('type')) {
            $query->whereIn('type', $request->input('type'));
        }

        // Фильтрация по году
        if ($request->has('year')) {
            $query->where('year', $request->year);
        }

        // Поиск по названию
        if ($request->has('search')) {
            $query->where('title', 'ilike', '%' . $request->search . '%')
                ->orWhere('original_title', 'ilike', '%' . $request->search . '%');
        }

        // Сортировка
        $sortBy = $request->input('sort_by', 'views_count');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Пагинация
        $perPage = $request->input('per_page', 20);
        $titles = $query->paginate($perPage);

        return response()->json($titles);
    }

    public function show($id)
    {
        $title = Title::with(['episodes.sources'])->findOrFail($id);

        return response()->json($title);
    }

    public function popular(Request $request)
    {
        $titles = Title::orderBy('views_count', 'desc')
            ->paginate($request->input('per_page', 10));

        return response()->json($titles);
    }

    public function search(Request $request)
    {
        $query = $request->input('q');

        // Сохраняем запрос в историю
        if ($request->user()) {
            $request->user()->searchQueries()->create([
                'query' => $query,
                'time' => now(),
            ]);
        }

        $titles = Title::where('title', 'ilike', "%{$query}%")
            ->orWhere('original_title', 'ilike', "%{$query}%")
            ->orWhere('description', 'ilike', "%{$query}%")
            ->limit(20)
            ->get();

        return response()->json($titles);
    }

    public function showWithEpisodes(Title $title)
    {
        $title->load(['episodes.sources']);

        return response()->json($title);
    }
}

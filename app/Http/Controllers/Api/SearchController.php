<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Title;
use App\Models\SearchQuery;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->input('q');
        $type = $request->input('type'); // title, comment, user

        $results = [];

        if (in_array('title', explode(',', $type ?? 'title'))) {
            $titlesQuery = Title::query();

            if ($query) {
                $titlesQuery->where(function ($q) use ($query) {
                    $q->where('title', 'ilike', "%{$query}%")
                        ->orWhere('original_title', 'ilike', "%{$query}%")
                        ->orWhere('description', 'ilike', "%{$query}%");
                });
            }

            $titles = $titlesQuery->limit(20)->get();

            // Сохраняем запрос в историю
            if ($query && $request->user()) {
                $request->user()->searchQueries()->create([
                    'query' => $query,
                    'time' => now(),
                ]);
            }

            $results['titles'] = $titles;
        }

        return response()->json($results);
    }

    public function popular(Request $request)
    {
        $queries = SearchQuery::orderBy('created_at', 'desc')
            ->groupBy('query')
            ->select('query', \DB::raw('COUNT(*) as count'))
            ->limit(10)
            ->get();

        return response()->json($queries);
    }
}

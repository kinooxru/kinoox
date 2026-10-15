<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Title;
use App\Models\Episode;
use App\Models\Source;
use App\Models\ViewHistory;
use Illuminate\Http\Request;

class PlayerController extends Controller
{
    public function getSource(Request $request, $sourceId)
    {
        $source = Source::findOrFail($sourceId);

        // Получаем информацию о плеере из внешнего API (vibix/veoveo)
        // Это заглушка, нужно будет интегрировать с реальными API
        $playerData = $this->fetchPlayerSource($source);

        // Сохраняем в историю просмотров
        if ($request->user()) {
            $this->saveViewHistory($request->user(), $source);
        }

        return response()->json($playerData);
    }

    public function getEpisode(Request $request, $episodeId)
    {
        $episode = Episode::with('sources')->findOrFail($episodeId);

        return response()->json($episode);
    }

    public function saveProgress(Request $request)
    {
        $request->validate([
            'source_id' => 'required|exists:sources,id',
            'time' => 'required|integer',
        ]);

        if ($request->user()) {
            $this->saveViewHistory($request->user(), $request->source_id);
        }

        return response()->json([
            'message' => 'Progress saved successfully',
        ]);
    }

    protected function fetchPlayerSource($source)
    {
        // Заглушка для получения данных из внешних источников
        // Здесь нужно будет интегрировать с vibix/veoveo API
        return [
            'source' => $source,
            'url' => null, // URL для плеера
            'embed_url' => null, // Embed URL если есть
        ];
    }

    protected function saveViewHistory($user, $sourceId)
    {
        $source = Source::find($sourceId);
        
        ViewHistory::updateOrCreate([
            'user_id' => $user->id,
            'title_id' => $source->episode->title_id,
            'source_id' => $sourceId,
        ], [
            'time' => now(),
        ]);

        // Увеличиваем счетчик просмотров
        $source->episode->title->increment('views_count');
    }
}

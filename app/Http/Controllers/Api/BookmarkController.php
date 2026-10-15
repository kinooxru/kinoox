<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bookmark;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BookmarkController extends Controller
{
    public function index(Request $request)
    {
        $bookmarks = Bookmark::where('user_id', $request->user()->id)
            ->with('title')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($bookmarks);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title_id' => 'required|exists:titles,id',
            'source_id' => 'nullable|exists:sources,id',
            'time' => 'nullable|integer',
        ]);

        $bookmark = Bookmark::updateOrCreate([
            'user_id' => $request->user()->id,
            'title_id' => $request->title_id,
            'source_id' => $request->source_id,
        ], [
            'time' => $request->time,
        ]);

        return response()->json($bookmark, 201);
    }

    public function destroy(Request $request, $id)
    {
        $bookmark = Bookmark::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $bookmark->delete();

        return response()->json([
            'message' => 'Bookmark deleted successfully',
        ]);
    }

    public function check(Request $request, $titleId)
    {
        $bookmark = Bookmark::where('user_id', $request->user()->id)
            ->where('title_id', $titleId)
            ->first();

        return response()->json([
            'is_bookmarked' => $bookmark !== null,
            'bookmark' => $bookmark,
        ]);
    }
}

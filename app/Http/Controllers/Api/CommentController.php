<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Title;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    public function index(Request $request, $titleId)
    {
        $title = Title::findOrFail($titleId);

        $comments = Comment::where('title_id', $titleId)
            ->with(['user' => function ($query) {
                $query->select('id', 'username', 'avatar_url');
            }])
            ->orderBy('time', 'desc')
            ->paginate(20);

        return response()->json($comments);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title_id' => 'required|exists:titles,id',
            'source_id' => 'nullable|exists:sources,id',
            'text' => 'required|string|min:1|max:5000',
        ]);

        $comment = Comment::create([
            'user_id' => $request->user()->id,
            'title_id' => $request->title_id,
            'source_id' => $request->source_id,
            'text' => $request->text,
            'time' => now(),
        ]);

        $comment->load('user');

        return response()->json($comment, 201);
    }

    public function update(Request $request, $id)
    {
        $comment = Comment::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $request->validate([
            'text' => 'required|string|min:1|max:5000',
        ]);

        $comment->update([
            'text' => $request->text,
        ]);

        return response()->json($comment);
    }

    public function destroy(Request $request, $id)
    {
        $comment = Comment::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $comment->delete();

        return response()->json([
            'message' => 'Comment deleted successfully',
        ]);
    }
}

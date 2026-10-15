<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Inertia;

class HandleInertiaRequests
{
    /**
     * Handle the incoming request.
     */
    public function handle(Request $request, \Closure $next): \Illuminate\Http\Response
    {
        $response = $next($request);

        $response->headers->set('Content-Type', $response->headers->get('Content-Type') . '; charset=utf-8');

        return $response;
    }

    /**
     * Merge the view composer data.
     */
    public function share(Request $request): array
    {
        return [
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'username' => $request->user()->username,
                    'email' => $request->user()->email,
                    'avatar_url' => $request->user()->avatar_url,
                    'role' => $request->user()->role,
                ] : null,
            ],
            'errors' => function () use ($request) {
                return $request->session()->get('errors') ? $request->session()->get('errors')->all() : [];
            },
        ];
    }
}

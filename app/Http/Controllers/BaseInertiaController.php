<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Application;
use Illuminate\Routing\Controller as BaseController;
use Inertia\Inertia;

class Controller extends BaseController
{
    use \Illuminate\Foundation\Auth\Access\AuthorizesRequests,
        \Illuminate\Foundation\Validation\ValidatesRequests,
        \Illuminate\Foundation\Bus\DispatchesJobs;

    protected function inertiaApp(array $props = [])
    {
        return Inertia::render('App', $props);
    }
}

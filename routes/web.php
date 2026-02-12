<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\AuthController;

// Public routes
Route::get('/', function () {
    return view('welcome');
})->name('home');

Route::get('/projects', function () {
    $category = request('category');
    $categories = ['design', 'pdf', 'cybersecurity', 'tutorial', 'certificate'];

    if ($category && in_array($category, $categories)) {
        $projects = \App\Models\Project::where('category', $category)->latest()->get();
    } else {
        $projects = \App\Models\Project::latest()->get();
    }

    return view('project', ['projects' => $projects, 'selectedCategory' => $category]);
})->name('projects');

Route::get('/comments', [CommentController::class, 'index'])->name('comments');

Route::post('/comments', [CommentController::class, 'store'])->name('comments.store');

Route::get('/project/{id}/download', function ($id) {
    $project = \App\Models\Project::findOrFail($id);
    $path = storage_path('app/public/' . $project->file_path);

    if (!file_exists($path)) {
        abort(404);
    }

    return response()->download($path, $project->original_filename);
})->name('project.download');

// Temporary route to fix storage link on hosting
Route::get('/fix-storage', function () {
    \Illuminate\Support\Facades\Artisan::call('storage:link');
    return 'Storage link created!';
});

// Authentication Routes
Route::middleware('guest')->group(function () {
    Route::get('/login', function () {
        return view('auth.login');
    })->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.store');

    Route::get('/register', function () {
        return view('auth.register');
    })->name('register');
    Route::post('/register', [AuthController::class, 'register'])->name('register.store');
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Project Management Routes
    Route::get('/dashboard/projects', [\App\Http\Controllers\Dashboard\ProjectController::class, 'index'])->name('dashboard.projects.index');
    Route::post('/dashboard/projects', [\App\Http\Controllers\Dashboard\ProjectController::class, 'store'])->name('dashboard.projects.store');
    Route::put('/dashboard/projects/{id}', [\App\Http\Controllers\Dashboard\ProjectController::class, 'update'])->name('dashboard.projects.update');
    Route::delete('/dashboard/projects/{id}', [\App\Http\Controllers\Dashboard\ProjectController::class, 'destroy'])->name('dashboard.projects.destroy');

    Route::post('/logout', function () {
        Auth::logout();
        session()->invalidate();
        session()->regenerateToken();
        return redirect('/');
    })->name('logout');

    // Blog Management Routes
    Route::resource('/dashboard/blogs', \App\Http\Controllers\Dashboard\BlogController::class, ['as' => 'dashboard']);
});

Route::get('/git-test', function () {
    return 'GIT DEPLOY OK 🚀';
});


// Public Blog Routes
Route::get('/blog', [\App\Http\Controllers\PublicBlogController::class, 'index'])->name('blog.index');
Route::get('/blog/{slug}', [\App\Http\Controllers\PublicBlogController::class, 'show'])->name('blog.show');

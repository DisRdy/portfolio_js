<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Blog;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $projectCount = $user->projects()->count();
        $blogCount = Blog::where('user_id', $user->id)->count();
        $publishedBlogCount = Blog::where('user_id', $user->id)->where('status', 'published')->count();
        $draftBlogCount = Blog::where('user_id', $user->id)->where('status', 'draft')->count();

        $recentProjects = $user->projects()->latest()->take(5)->get();
        $recentBlogs = Blog::where('user_id', $user->id)->latest()->take(5)->get();

        return view('dashboard', compact(
            'projectCount',
            'blogCount',
            'publishedBlogCount',
            'draftBlogCount',
            'recentProjects',
            'recentBlogs'
        ));
    }
}

<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class BlogController extends Controller
{
    public function index()
    {
        $blogs = Blog::where('user_id', Auth::id())->latest()->get();
        return view('dashboard.blogs.index', compact('blogs'));
    }

    public function create()
    {
        return redirect()->route('dashboard.blogs.index');
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'image' => 'nullable|image|max:2048', // 2MB Max
            'content' => 'required',
            'status' => 'required|in:draft,published',
            'published_at' => 'nullable|date',
        ]);

        $slug = Str::slug($request->title);
        if (Blog::where('slug', $slug)->exists()) {
            $slug = $slug . '-' . time();
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('blogs', 'public');
        }

        Blog::create([
            'user_id' => Auth::id(),
            'title' => $request->title,
            'subtitle' => $request->subtitle,
            'image' => $imagePath,
            'slug' => $slug,
            'content' => $request->input('content'),
            'status' => $request->status,
            'published_at' => $request->status === 'published' ? ($request->published_at ?? now()) : null,
        ]);

        return redirect()->route('dashboard.blogs.index')->with('success', 'Blog created successfully.');
    }

    public function edit(Blog $blog)
    {
        if ($blog->user_id !== Auth::id()) {
            abort(403);
        }
        return redirect()->route('dashboard.blogs.index');
    }

    public function update(Request $request, Blog $blog)
    {
        if ($blog->user_id !== Auth::id()) {
            abort(403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'image' => 'nullable|image|max:2048',
            'content' => 'required',
            'status' => 'required|in:draft,published',
            'published_at' => 'nullable|date',
        ]);

        $data = [
            'title' => $request->title,
            'subtitle' => $request->subtitle,
            'content' => $request->input('content'),
            'status' => $request->status,
            'published_at' => $request->status === 'published' ? ($request->published_at ?? $blog->published_at ?? now()) : null,
        ];

        if ($request->hasFile('image')) {
            // Delete old image
            if ($blog->image && Storage::disk('public')->exists($blog->image)) {
                Storage::disk('public')->delete($blog->image);
            }
            $data['image'] = $request->file('image')->store('blogs', 'public');
        }

        $blog->update($data);

        return redirect()->route('dashboard.blogs.index')->with('success', 'Blog updated successfully.');
    }

    public function destroy(Blog $blog)
    {
        if ($blog->user_id !== Auth::id()) {
            abort(403);
        }

        if ($blog->image && Storage::disk('public')->exists($blog->image)) {
            Storage::disk('public')->delete($blog->image);
        }

        $blog->delete();
        return redirect()->route('dashboard.blogs.index')->with('success', 'Blog deleted successfully.');
    }
}

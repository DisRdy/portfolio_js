<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ProjectController extends Controller
{
    public function index()
    {
        $projects = Project::where('user_id', Auth::id())->latest()->get();
        return view('dashboard.projects.index', compact('projects'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'category' => 'required|in:design,pdf,cybersecurity,tutorial,certificate',
            'file' => 'required|file|max:10240',
        ]);

        try {
            $file = $request->file('file');
            $filePath = $file->store('projects/' . $request->category, 'public');

            Project::create([
                'user_id' => Auth::id(),
                'title' => $request->title,
                'description' => $request->description,
                'category' => $request->category,
                'file_path' => $filePath,
                'original_filename' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
            ]);

            return redirect()->route('dashboard.projects.index')->with('success', 'Project berhasil diupload!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal mengupload project: ' . $e->getMessage())->withInput();
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'category' => 'required|in:design,pdf,cybersecurity,tutorial,certificate',
            'file' => 'nullable|file|max:10240',
        ]);

        try {
            $project = Project::findOrFail($id);

            if ($project->user_id !== Auth::id()) {
                return redirect()->route('dashboard.projects.index')
                    ->with('error', 'Anda tidak memiliki izin untuk mengedit project ini.');
            }

            if ($request->hasFile('file')) {
                if (Storage::disk('public')->exists($project->file_path)) {
                    Storage::disk('public')->delete($project->file_path);
                }

                $file = $request->file('file');
                $filePath = $file->store('projects/' . $request->category, 'public');

                $project->file_path = $filePath;
                $project->original_filename = $file->getClientOriginalName();
                $project->file_size = $file->getSize();
            }

            $project->title = $request->title;
            $project->description = $request->description;
            $project->category = $request->category;
            $project->save();

            return redirect()->route('dashboard.projects.index')
                ->with('success', 'Project berhasil diperbarui!');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal memperbarui project: ' . $e->getMessage());
        }
    }

    public function destroy($id)
    {
        try {
            $project = Project::findOrFail($id);

            if ($project->user_id !== Auth::id()) {
                return redirect()->route('dashboard.projects.index')->with('error', 'Anda tidak memiliki izin untuk menghapus project ini.');
            }

            if (Storage::disk('public')->exists($project->file_path)) {
                Storage::disk('public')->delete($project->file_path);
            }

            $project->delete();

            return redirect()->route('dashboard.projects.index')->with('success', 'Project berhasil dihapus!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menghapus project: ' . $e->getMessage());
        }
    }
}

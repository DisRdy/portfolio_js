<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Post</title>
    <link rel="icon" href="{{ asset('img/LOGODR.png') }}" type="image/png">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>

<body>
    <x-dashboard-navbar />

    <div class="dashboard-wrapper">
        <div class="container" style="max-width: 800px;">
            <div class="dashboard-header">
                <h1>Edit Post</h1>
            </div>

            <form action="{{ route('dashboard.blogs.update', $blog->id) }}" method="POST" enctype="multipart/form-data"
                class="auth-wrapper" style="max-width: 100%; margin: 0;">
                @csrf
                @method('PUT')

                <div>
                    <label for="title" class="form-group-label">Title</label>
                    <input type="text" name="title" id="title" class="form-input"
                        value="{{ old('title', $blog->title) }}" required>
                    @error('title') <span class="form-error">{{ $message }}</span> @enderror
                </div>

                <div>
                    <label for="subtitle" class="form-group-label">Subtitle (Optional)</label>
                    <input type="text" name="subtitle" id="subtitle" class="form-input"
                        value="{{ old('subtitle', $blog->subtitle) }}">
                    @error('subtitle') <span class="form-error">{{ $message }}</span> @enderror
                </div>

                <div>
                    <label for="image" class="form-group-label">Cover Image (Optional)</label>
                    @if($blog->image)
                        <div style="margin-bottom: 0.5rem;">
                            <img src="{{ asset('storage/' . $blog->image) }}" alt="Current Image"
                                style="max-width: 200px; border-radius: 8px; border: 1px solid var(--glass-border);">
                        </div>
                    @endif
                    <input type="file" name="image" id="image" class="form-input" accept="image/*">
                    <small class="form-help-text">Leave blank to keep current image</small>
                    @error('image') <span class="form-error">{{ $message }}</span> @enderror
                </div>

                <div>
                    <label for="content" class="form-group-label">Content</label>
                    <textarea name="content" id="content" class="form-textarea" required
                        rows="10">{{ old('content', $blog->content) }}</textarea>
                    @error('content') <span class="form-error">{{ $message }}</span> @enderror
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label for="status" class="form-group-label">Status</label>
                        <select name="status" id="status" class="form-input">
                            <option value="draft" {{ old('status', $blog->status) == 'draft' ? 'selected' : '' }}>Draft
                            </option>
                            <option value="published" {{ old('status', $blog->status) == 'published' ? 'selected' : '' }}>
                                Published</option>
                        </select>
                        @error('status') <span class="form-error">{{ $message }}</span> @enderror
                    </div>

                    <div>
                        <label for="published_at" class="form-group-label">Published At</label>
                        <input type="datetime-local" name="published_at" id="published_at" class="form-input"
                            value="{{ old('published_at', $blog->published_at ? $blog->published_at->format('Y-m-d\TH:i') : '') }}">
                        @error('published_at') <span class="form-error">{{ $message }}</span> @enderror
                    </div>
                    <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                        <a href="{{ route('dashboard.blogs.index') }}" class="btn-secondary">Cancel</a>
                        <button type="submit" class="btn">Update Post</button>
                    </div>
                </div>

            </form>
        </div>
    </div>
</body>

</html>
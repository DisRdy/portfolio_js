<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create New Post</title>
    <link rel="icon" href="{{ asset('img/LOGODR.png') }}" type="image/png">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>

<body>
    <x-dashboard-navbar />

    <div class="dashboard-wrapper">
        <div class="container" style="max-width: 800px;">
            <div class="dashboard-header">
                <h1>Create New Post</h1>
            </div>

            <form action="{{ route('dashboard.blogs.store') }}" method="POST" enctype="multipart/form-data"
                class="auth-wrapper" style="max-width: 100%; margin: 0;">
                @csrf

                <div>
                    <label for="title" class="form-group-label">Title</label>
                    <input type="text" name="title" id="title" class="form-input" value="{{ old('title') }}" required>
                    @error('title') <span class="form-error">{{ $message }}</span> @enderror
                </div>

                <div>
                    <label for="subtitle" class="form-group-label">Subtitle (Optional)</label>
                    <input type="text" name="subtitle" id="subtitle" class="form-input" value="{{ old('subtitle') }}">
                    @error('subtitle') <span class="form-error">{{ $message }}</span> @enderror
                </div>

                <div>
                    <label for="image" class="form-group-label">Cover Image (Optional)</label>
                    <input type="file" name="image" id="image" class="form-input" accept="image/*">
                    @error('image') <span class="form-error">{{ $message }}</span> @enderror
                </div>

                <div>
                    <label for="content" class="form-group-label">Content</label>
                    <textarea name="content" id="content" class="form-textarea" required
                        rows="10">{{ old('content') }}</textarea>
                    @error('content') <span class="form-error">{{ $message }}</span> @enderror
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label for="status" class="form-group-label">Status</label>
                        <select name="status" id="status" class="form-input">
                            <option value="draft" {{ old('status') == 'draft' ? 'selected' : '' }}>Draft</option>
                            <option value="published" {{ old('status') == 'published' ? 'selected' : '' }}>Published
                            </option>
                        </select>
                        @error('status') <span class="form-error">{{ $message }}</span> @enderror
                    </div>

                    <div>
                        <label for="published_at" class="form-group-label">Published At</label>
                        <input type="datetime-local" name="published_at" id="published_at" class="form-input"
                            value="{{ old('published_at') }}">
                        @error('published_at') <span class="form-error">{{ $message }}</span> @enderror
                    </div>
                    <div style="margin-top: 1.5rem; display: flex; gap: 1rem">
                        <a href="{{ route('dashboard.blogs.index') }}" class="btn-secondary">Cancel</a>
                        <button type="submit" class="btn">Create Post</button>
                    </div>
                </div>

            </form>
        </div>
    </div>
</body>

</html>
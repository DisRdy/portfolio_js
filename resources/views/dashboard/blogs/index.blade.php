<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Blogs - Dashboard</title>
    <link rel="icon" href="{{ asset('img/LOGODR.png') }}" type="image/png">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>

<body>
    <x-dashboard-navbar />

    @include('partials.toast')

    <div class="dashboard-wrapper">
        <div class="container">
            <div class="dashboard-header">
                <div class="dashboard-title">
                    <h1>Manage Blogs</h1>
                    <button type="button" class="btn" style="margin-left: auto; width: auto;" id="open-create-modal">
                        + New Post
                    </button>
                </div>
                <hr class="divider">
            </div>

            <div class="project-list">
                @forelse($blogs as $blog)
                    <div class="project-item">
                        <div class="project-item-info">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 0.5rem;">
                                <h5>{{ $blog->title }}</h5>
                                <span class="badge {{ $blog->status === 'published' ? 'badge-success' : 'badge-warning' }}">
                                    {{ ucfirst($blog->status) }}
                                </span>
                            </div>
                            @if($blog->subtitle)
                                <p>{{ Str::limit($blog->subtitle, 80) }}</p>
                            @endif
                            <p class="file-details">
                                <small>Published:
                                    {{ $blog->published_at ? $blog->published_at->format('d M Y') : '-' }}</small>
                            </p>

                            <div class="project-item-actions">
                                <button type="button" class="btn-edit open-edit-modal" data-id="{{ $blog->id }}"
                                    data-title="{{ $blog->title }}" data-subtitle="{{ $blog->subtitle }}"
                                    data-content="{{ $blog->content }}" data-status="{{ $blog->status }}"
                                    data-published-at="{{ $blog->published_at ? $blog->published_at->format('Y-m-d\TH:i') : '' }}"
                                    data-image="{{ $blog->image }}"
                                    data-update-url="{{ route('dashboard.blogs.update', $blog->id) }}">
                                    Edit
                                </button>
                                <form action="{{ route('dashboard.blogs.destroy', $blog->id) }}" method="POST"
                                    class="delete-form-trigger">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit" class="btn-delete">Delete</button>
                                </form>
                            </div>
                        </div>
                    </div>
                @empty
                    <div class="empty-state">
                        <p>You haven't created any blog posts yet.</p>
                    </div>
                @endforelse
            </div>

            <a href="{{ route('dashboard') }}" class="btn-secondary" style="margin-top: 2rem;">
                &larr; Back to Dashboard
            </a>
        </div>
    </div>

    {{-- ======== CREATE BLOG MODAL ======== --}}
    <div id="create-blog-modal" class="modal-overlay" style="display: none;">
        <div class="modal-content modal-content-lg">
            <div class="modal-header">
                <h2>Create New Post</h2>
                <button type="button" class="modal-close close-modal">&times;</button>
            </div>

            <form action="{{ route('dashboard.blogs.store') }}" method="POST" enctype="multipart/form-data">
                @csrf

                <div>
                    <label for="create-title" class="form-group-label">Title</label>
                    <input type="text" name="title" id="create-title" class="form-input" value="{{ old('title') }}"
                        required>
                    @error('title') <span class="form-error">{{ $message }}</span> @enderror
                </div>

                <div>
                    <label for="create-subtitle" class="form-group-label">Subtitle (Optional)</label>
                    <input type="text" name="subtitle" id="create-subtitle" class="form-input"
                        value="{{ old('subtitle') }}">
                    @error('subtitle') <span class="form-error">{{ $message }}</span> @enderror
                </div>

                <div>
                    <label for="create-image" class="form-group-label">Cover Image (Optional)</label>
                    <input type="file" name="image" id="create-image" class="form-input" accept="image/*">
                    @error('image') <span class="form-error">{{ $message }}</span> @enderror
                </div>

                <div>
                    <label for="create-content" class="form-group-label">Content</label>
                    <textarea name="content" id="create-content" class="form-textarea" required
                        rows="8">{{ old('content') }}</textarea>
                    @error('content') <span class="form-error">{{ $message }}</span> @enderror
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label for="create-status" class="form-group-label">Status</label>
                        <select name="status" id="create-status" class="form-input">
                            <option value="draft" {{ old('status') == 'draft' ? 'selected' : '' }}>Draft</option>
                            <option value="published" {{ old('status') == 'published' ? 'selected' : '' }}>Published
                            </option>
                        </select>
                    </div>
                    <div>
                        <label for="create-published_at" class="form-group-label">Published At</label>
                        <input type="datetime-local" name="published_at" id="create-published_at" class="form-input"
                            value="{{ old('published_at') }}">
                    </div>
                </div>

                <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                    <button type="button" class="btn-secondary close-modal">Cancel</button>
                    <button type="submit" class="btn">Create Post</button>
                </div>
            </form>
        </div>
    </div>

    {{-- ======== EDIT BLOG MODAL ======== --}}
    <div id="edit-blog-modal" class="modal-overlay" style="display: none;">
        <div class="modal-content modal-content-lg">
            <div class="modal-header">
                <h2>Edit Post</h2>
                <button type="button" class="modal-close close-modal">&times;</button>
            </div>

            <form id="edit-blog-form" method="POST" enctype="multipart/form-data">
                @csrf
                @method('PUT')

                <div>
                    <label for="edit-title" class="form-group-label">Title</label>
                    <input type="text" name="title" id="edit-title" class="form-input" required>
                </div>

                <div>
                    <label for="edit-subtitle" class="form-group-label">Subtitle (Optional)</label>
                    <input type="text" name="subtitle" id="edit-subtitle" class="form-input">
                </div>

                <div>
                    <label for="edit-image" class="form-group-label">Cover Image (Optional)</label>
                    <div id="edit-image-preview" style="margin-bottom: 0.5rem; display: none;">
                        <img id="edit-image-img" src="" alt="Current Image"
                            style="max-width: 200px; border-radius: 8px; border: 1px solid var(--glass-border);">
                    </div>
                    <input type="file" name="image" id="edit-image" class="form-input" accept="image/*">
                    <small class="form-help-text">Leave blank to keep current image</small>
                </div>

                <div>
                    <label for="edit-content" class="form-group-label">Content</label>
                    <textarea name="content" id="edit-content" class="form-textarea" required rows="8"></textarea>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label for="edit-status" class="form-group-label">Status</label>
                        <select name="status" id="edit-status" class="form-input">
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </div>
                    <div>
                        <label for="edit-published_at" class="form-group-label">Published At</label>
                        <input type="datetime-local" name="published_at" id="edit-published_at" class="form-input">
                    </div>
                </div>

                <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                    <button type="button" class="btn-secondary close-modal">Cancel</button>
                    <button type="submit" class="btn">Update Post</button>
                </div>
            </form>
        </div>
    </div>

    {{-- ======== DELETE CONFIRMATION MODAL ======== --}}
    <div id="confirmation-modal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Konfirmasi Hapus</h2>
            </div>
            <p>Apakah Anda yakin ingin menghapus blog ini?</p>
            <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                <button id="cancel-delete" class="btn-secondary">Batal</button>
                <form id="delete-form-confirm" method="POST">
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="btn-delete">Ya, Hapus</button>
                </form>
            </div>
        </div>
    </div>

</body>

</html>
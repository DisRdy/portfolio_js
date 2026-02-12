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
                    <a href="{{ route('dashboard.blogs.create') }}" class="btn" style="margin-left: auto; width: auto;">
                        + New Post
                    </a>
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
                                <a href="{{ route('dashboard.blogs.edit', $blog->id) }}" class="btn-edit">
                                    Edit
                                </a>
                                <form action="{{ route('dashboard.blogs.destroy', $blog->id) }}" method="POST"
                                    onsubmit="return confirm('Are you sure?');">
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
</body>

</html>
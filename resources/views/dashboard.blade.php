<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>
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
                    <h1>Dashboard</h1>
                </div>
                <hr class="divider">
            </div>

            {{-- Summary Cards --}}
            <div class="summary-grid">
                <a href="{{ route('dashboard.projects.index') }}" class="summary-card">
                    <div class="summary-icon"></div>
                    <div class="summary-info">
                        <span class="summary-count">{{ $projectCount }}</span>
                        <span class="summary-label">Projects</span>
                    </div>
                </a>

                <a href="{{ route('dashboard.blogs.index') }}" class="summary-card">
                    <div class="summary-icon"></div>
                    <div class="summary-info">
                        <span class="summary-count">{{ $blogCount }}</span>
                        <span class="summary-label">Blog Posts</span>
                    </div>
                </a>

                <div class="summary-card">
                    <div class="summary-icon"></div>
                    <div class="summary-info">
                        <span class="summary-count">{{ $publishedBlogCount }}</span>
                        <span class="summary-label">Published</span>
                    </div>
                </div>

                <div class="summary-card">
                    <div class="summary-icon"></div>
                    <div class="summary-info">
                        <span class="summary-count">{{ $draftBlogCount }}</span>
                        <span class="summary-label">Drafts</span>
                    </div>
                </div>
            </div>

            {{-- Recent Projects --}}
            <div class="dashboard-section">
                <div class="section-header">
                    <h3>Recent Projects</h3>
                    <a href="{{ route('dashboard.projects.index') }}" class="section-link">View All &rarr;</a>
                </div>
                @if($recentProjects->isEmpty())
                    <p class="empty-text">No projects yet.</p>
                @else
                    <div class="project-list">
                        @foreach($recentProjects as $project)
                            <div class="project-item">
                                <div class="project-item-info">
                                    <h5>{{ $project->title }}</h5>
                                    <p class="file-details">
                                        {{ $project->category }} &bull;
                                        {{ $project->original_filename }}
                                    </p>
                                </div>
                            </div>
                        @endforeach
                    </div>
                @endif
            </div>

            {{-- Recent Blogs --}}
            <div class="dashboard-section">
                <div class="section-header">
                    <h3>Recent Blogs</h3>
                    <a href="{{ route('dashboard.blogs.index') }}" class="section-link">View All &rarr;</a>
                </div>
                @if($recentBlogs->isEmpty())
                    <p class="empty-text">No blog posts yet.</p>
                @else
                    <div class="project-list">
                        @foreach($recentBlogs as $blog)
                            <div class="project-item">
                                <div class="project-item-info">
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <h5>{{ $blog->title }}</h5>
                                        <span
                                            class="badge {{ $blog->status === 'published' ? 'badge-success' : 'badge-warning' }}">
                                            {{ ucfirst($blog->status) }}
                                        </span>
                                    </div>
                                    <p class="file-details">
                                        {{ $blog->published_at ? $blog->published_at->format('d M Y') : 'Not published' }}
                                    </p>
                                </div>
                            </div>
                        @endforeach
                    </div>
                @endif
            </div>

        </div>
    </div>

    <footer>
        <p>&copy; 2025 Dr</p>
    </footer>

</body>

</html>
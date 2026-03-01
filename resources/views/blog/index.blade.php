<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog - Dr</title>
    <link rel="icon" href="{{ asset('img/LOGODR.png') }}" type="image/png">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>

<body>
    <x-public-navbar />

    <header>
        <p class="brand-ts">Thoughts & Articles</p>
    </header>

    <div class="container">
        <section>
            <h2 style="margin-bottom: 2rem;">Latest Posts</h2>

            @if($blogs->isEmpty())
                <div class="alert alert-info">
                    <p>No posts published yet. Check back later!</p>
                </div>
            @else
                <div class="blog-list">
                    @foreach($blogs as $blog)
                        <div class="blog-card project-card">
                            <div class="project-body">
                                <a href="{{ route('blog.show', $blog->slug) }}" class="blog-link">
                                    <h3 class="blog-title">{{ $blog->title }}</h3>
                                </a>
                                @if($blog->subtitle)
                                    <p class="blog-subtitle">{{ $blog->subtitle }}</p>
                                @endif
                                <small class="blog-date">
                                    {{ $blog->published_at->format('F d, Y') }}
                                </small>
                            </div>
                        </div>
                    @endforeach
                </div>
            @endif
        </section>
    </div>

    <footer>
        <p>&copy; {{ date('Y') }} Dr</p>
    </footer>
</body>

</html>
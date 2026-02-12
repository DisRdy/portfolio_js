<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $blog->title }} - Dr</title>
    <link rel="icon" href="{{ asset('img/LOGODR.png') }}" type="image/png">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>

<body>
    <x-public-navbar />

    <div class="container blog-detail-container">
        <article class="blog-article">
            <header class="blog-header">
                <h1 class="article-title">{{ $blog->title }}</h1>
                @if($blog->subtitle)
                    <p class="article-subtitle">{{ $blog->subtitle }}</p>
                    @if($blog->image)
                        <div class="article-image-container" style="margin-bottom: 2rem;">
                            <img src="{{ asset('storage/' . $blog->image) }}" alt="{{ $blog->title }}" class="article-image"
                                style="width: 100%; max-height: 400px; object-fit: cover; border-radius: var(--radius-lg); border: 1px solid var(--glass-border);">
                        </div>
                    @endif
                @endif
                <div class="article-meta">
                    <span>Published on {{ $blog->published_at->format('F d, Y') }}</span>
                </div>
            </header>

            <div class="article-content">
                {!! nl2br(e($blog->content)) !!}
            </div>

            <div class="article-footer">
                <a href="{{ route('blog.index') }}" class="btn-secondary">
                    &larr; Back to Articles
                </a>
            </div>
        </article>
    </div>

    <footer>
        <p>&copy; {{ date('Y') }} Dr</p>
    </footer>
</body>

</html>
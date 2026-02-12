<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project</title>
    <link rel="icon" href="{{ asset('img/LOGODR.png') }}" type="image/png">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>

<body>
    <x-public-navbar />

    <header>
        <p class="brand-ts">My Collection</p>
    </header>

    <div class="container">
        <section>
            <h2>Projects</h2>

            <!-- Category Navigation -->
            <div class="category-nav">
                <span class="category-label">Filter Kategori:</span>
                <a href="{{ route('projects') }}" @if(!$selectedCategory) class="active" @endif>
                    Semua Kategori
                </a>
                <a href="{{ route('projects', ['category' => 'design']) }}" @if($selectedCategory === 'design')
                class="active" @endif>
                    Design
                </a>
                <a href="{{ route('projects', ['category' => 'pdf']) }}" @if($selectedCategory === 'pdf') class="active"
                @endif>
                    Dokumentasi
                </a>
                <a href="{{ route('projects', ['category' => 'tutorial']) }}" @if($selectedCategory === 'tutorial')
                class="active" @endif>
                    Tutorial IT
                </a>
                <a href="{{ route('projects', ['category' => 'certificate']) }}" @if($selectedCategory === 'certificate')
                class="active" @endif>
                    Sertifikat
                </a>
            </div>

            @php
                $groupedProjects = $projects->groupBy('category');
            @endphp

            @if($projects->count() === 0)
                <div class="alert alert-info">
                    <p>
                        @if($selectedCategory)
                            Belum ada proyek dalam kategori <strong>{{ ucfirst($selectedCategory) }}</strong>.
                        @else
                            Belum ada proyek yang diupload.
                        @endif
                    </p>
                </div>
            @else
                @if($selectedCategory)
                    <!-- Display Single Category -->
                    <div>
                        @php
                            $categoryLabels = [
                                'design' => 'Design',
                                'pdf' => 'Dokumentasi',
                                'tutorial' => 'Tutorial IT',
                                'certificate' => 'Sertifikat'
                            ];
                            $label = $categoryLabels[$selectedCategory] ?? ucfirst($selectedCategory);
                        @endphp
                        <h3 class="category-title">{{ $label }}</h3>
                        <p class="category-count">Total: <strong>{{ $projects->count() }}</strong> proyek</p>
                        <div class="grid-auto-lg">
                            @foreach($projects as $project)
                                <div class="project-card">
                                    <div class="project-header">
                                        <h4>{{ $project->title }}</h4>
                                        <p class="project-date">
                                            {{ \Carbon\Carbon::parse($project->created_at)->translatedFormat('d F Y') }}
                                        </p>
                                    </div>
                                    <div class="project-body">
                                        @if($project->description)
                                            <p>
                                                {{ Str::limit($project->description, 150) }}
                                            </p>
                                        @endif
                                        <div class="file-info">
                                            <p>
                                                <strong>{{ $project->original_filename }}</strong>
                                            </p>
                                            <small>
                                                {{ number_format($project->file_size / 1024, 2) }} KB
                                            </small>
                                        </div>
                                        <a href="{{ route('project.download', $project->id) }}" class="btn">
                                            Download File
                                        </a>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    </div>
                @else
                    <!-- Display All Categories -->
                    @foreach(['design' => 'Design', 'pdf' => 'Dokumentasi', 'tutorial' => 'Tutorial IT', 'certificate' => 'Sertifikat'] as $key => $label)
                        @if($groupedProjects->has($key))
                            <div>
                                <h3 class="category-title">{{ $label }}</h3>
                                <p class="category-count">Total: <strong>{{ $groupedProjects[$key]->count() }}</strong></p>
                                <div class="grid-auto-lg">
                                    @foreach($groupedProjects[$key] as $project)
                                        <div class="project-card">
                                            <div class="project-header">
                                                <h4>{{ $project->title }}</h4>
                                                <p class="project-date">
                                                    {{ \Carbon\Carbon::parse($project->created_at)->translatedFormat('d F Y') }}
                                                </p>
                                            </div>
                                            <div class="project-body">
                                                @if($project->description)
                                                    <p>
                                                        {{ Str::limit($project->description, 150) }}
                                                    </p>
                                                @endif
                                                <div class="file-info">
                                                    <p>
                                                        <strong>{{ $project->original_filename }}</strong>
                                                    </p>
                                                    <small>
                                                        {{ number_format($project->file_size / 1024, 2) }} KB
                                                    </small>
                                                </div>
                                                <a href="{{ route('project.download', $project->id) }}" class="btn">
                                                    Download File
                                                </a>
                                            </div>
                                        </div>
                                    @endforeach
                                </div>
                            </div>
                        @endif
                    @endforeach
                @endif
            @endif
        </section>
    </div>

    <footer>
        <p>&copy; 2025 Dr</p>
    </footer>
</body>

</html>
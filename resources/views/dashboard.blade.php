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
                <div class="dashboard-header-top">
                    <div class="dashboard-title">
                        <h1>Dashboard</h1>

                    </div>
                </div>

                <hr class="divider">

                <!-- Project Upload Form (Always visible for Create) -->
                @include('partials.project-upload-form', ['editingProject' => null, 'showAlerts' => !isset($editingProject)])

                <!-- Edit Modal (Visible only when editing) -->
                @if(isset($editingProject) && $editingProject)
                    <div class="modal-overlay">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h2>Edit Project</h2>
                                <a href="{{ route('dashboard') }}" class="modal-close">&times;</a>
                            </div>
                            @include('partials.project-upload-form', ['editingProject' => $editingProject, 'showAlerts' => true])
                        </div>
                    </div>
                @endif


                <div class="project-list-section">
                    <h3 class="project-list-title">Project Saya</h3>

                    @if($projects->isEmpty())
                        <p class="no-projects-message">Anda belum memiliki project. Upload project pertama Anda!</p>
                    @else
                        @php
                            $groupedProjects = $projects->groupBy('category');
                        @endphp

                        @foreach(['design' => 'Design', 'pdf' => 'Dokumentasi', 'tutorial' => 'Tutorial IT', 'certificate' => 'Sertifikat'] as $key => $label)
                            @if($groupedProjects->has($key))
                                <div>
                                    <h4 class="category-section-title">{{ $label }}</h4>
                                    <div class="project-list">
                                        @foreach($groupedProjects[$key] as $project)
                                            <div class="project-item">
                                                <div class="project-item-info">
                                                    <h5>{{ $project->title }}</h5>
                                                    @if($project->description)
                                                        <p>{{ Str::limit($project->description, 100) }}</p>
                                                    @endif
                                                    <p class="file-details">
                                                        {{ $project->original_filename }}
                                                        ({{ number_format($project->file_size / 1024, 2) }} KB)
                                                    </p>
                                                    <div class="project-item-actions">
                                                        <a href="{{ route('projects.edit', $project->id) }}" class="btn-edit">
                                                            Edit
                                                        </a>

                                                        <form action="{{ route('projects.destroy', $project->id) }}" method="POST"
                                                            class="delete-form-trigger">
                                                            @csrf
                                                            @method('DELETE')
                                                            <button type="submit" class="btn-delete">
                                                                Hapus
                                                            </button>
                                                        </form>
                                                    </div>
                                                </div>
                                            </div>
                                        @endforeach
                                    </div>
                                </div>
                            @endif
                        @endforeach
                    @endif
                </div>

                <hr class="divider">
            </div>
        </div>
    </div>

    <!-- Confirmation Modal -->
    <div id="confirmation-modal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Konfirmasi Hapus</h2>
            </div>
            <p>Apakah Anda yakin ingin menghapus project ini?</p>
            <div>
                <button id="cancel-delete" class="btn-secondary">Batal</button>
                <form id="delete-form-confirm" method="POST">
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="btn-delete">Ya, Hapus</button>
                </form>
            </div>
        </div>
    </div>



    <footer>
        <p>&copy; 2025 Dr</p>
    </footer>
</body>

</html>
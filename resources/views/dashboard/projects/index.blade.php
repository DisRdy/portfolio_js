<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Projects - Dashboard</title>
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
                    <h1>Manage Projects</h1>
                    <button type="button" class="btn" style="margin-left: auto; width: auto;"
                        id="open-create-project-modal">
                        + New Project
                    </button>
                </div>
                <hr class="divider">
            </div>

            @if($projects->isEmpty())
                <div class="empty-state">
                    <p>Anda belum memiliki project. Upload project pertama Anda!</p>
                </div>
            @else
                @php
                    $groupedProjects = $projects->groupBy('category');
                @endphp

                @foreach(['design' => 'Design', 'pdf' => 'Dokumentasi', 'cybersecurity' => 'Cybersecurity', 'tutorial' => 'Tutorial IT', 'certificate' => 'Sertifikat'] as $key => $label)
                    @if($groupedProjects->has($key))
                        <div class="project-list-section">
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
                                                <button type="button" class="btn-edit open-edit-project-modal"
                                                    data-id="{{ $project->id }}" data-title="{{ $project->title }}"
                                                    data-description="{{ $project->description }}"
                                                    data-category="{{ $project->category }}"
                                                    data-filename="{{ $project->original_filename }}"
                                                    data-filesize="{{ number_format($project->file_size / 1024, 2) }}"
                                                    data-update-url="{{ route('dashboard.projects.update', $project->id) }}">
                                                    Edit
                                                </button>
                                                <form action="{{ route('dashboard.projects.destroy', $project->id) }}" method="POST"
                                                    class="delete-form-trigger">
                                                    @csrf
                                                    @method('DELETE')
                                                    <button type="submit" class="btn-delete">Hapus</button>
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

            <a href="{{ route('dashboard') }}" class="btn-secondary" style="margin-top: 2rem;">
                &larr; Back to Dashboard
            </a>
        </div>
    </div>

    {{-- ======== CREATE PROJECT MODAL ======== --}}
    <div id="create-project-modal" class="modal-overlay" style="display: none;">
        <div class="modal-content modal-content-lg">
            <div class="modal-header">
                <h2>Upload Project Baru</h2>
                <button type="button" class="modal-close close-modal">&times;</button>
            </div>

            <form action="{{ route('dashboard.projects.store') }}" method="POST" enctype="multipart/form-data">
                @csrf

                <div>
                    <label class="form-group-label">Judul Project</label>
                    <input type="text" name="title" class="form-input" placeholder="Masukkan judul project"
                        value="{{ old('title') }}" required>
                    @error('title') <span class="form-error">{{ $message }}</span> @enderror
                </div>

                <div>
                    <label class="form-group-label">Deskripsi (Opsional)</label>
                    <textarea name="description" class="form-textarea"
                        placeholder="Deskripsi singkat project">{{ old('description') }}</textarea>
                    @error('description') <span class="form-error">{{ $message }}</span> @enderror
                </div>

                <div>
                    <label class="form-group-label">Kategori</label>
                    <select name="category" class="form-input" required>
                        <option value="">-- Pilih Kategori --</option>
                        <option value="design" {{ old('category') == 'design' ? 'selected' : '' }}>Design</option>
                        <option value="pdf" {{ old('category') == 'pdf' ? 'selected' : '' }}>PDF</option>
                        <option value="cybersecurity" {{ old('category') == 'cybersecurity' ? 'selected' : '' }}>
                            Cybersecurity</option>
                        <option value="tutorial" {{ old('category') == 'tutorial' ? 'selected' : '' }}>Tutorial</option>
                        <option value="certificate" {{ old('category') == 'certificate' ? 'selected' : '' }}>Sertifikat
                        </option>
                    </select>
                    @error('category') <span class="form-error">{{ $message }}</span> @enderror
                </div>

                <div>
                    <label class="form-group-label">File (Max 10MB)</label>
                    <input type="file" name="file" class="form-input" required>
                    @error('file') <span class="form-error">{{ $message }}</span> @enderror
                </div>

                <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                    <button type="button" class="btn-secondary close-modal">Batal</button>
                    <button type="submit" class="btn">Upload Project</button>
                </div>
            </form>
        </div>
    </div>

    {{-- ======== EDIT PROJECT MODAL ======== --}}
    <div id="edit-project-modal" class="modal-overlay" style="display: none;">
        <div class="modal-content modal-content-lg">
            <div class="modal-header">
                <h2>Edit Project</h2>
                <button type="button" class="modal-close close-modal">&times;</button>
            </div>

            <form id="edit-project-form" method="POST" enctype="multipart/form-data">
                @csrf
                @method('PUT')

                <div>
                    <label class="form-group-label">Judul Project</label>
                    <input type="text" name="title" id="edit-project-title" class="form-input" required>
                </div>

                <div>
                    <label class="form-group-label">Deskripsi (Opsional)</label>
                    <textarea name="description" id="edit-project-description" class="form-textarea"></textarea>
                </div>

                <div>
                    <label class="form-group-label">Kategori</label>
                    <select name="category" id="edit-project-category" class="form-input" required>
                        <option value="design">Design</option>
                        <option value="pdf">PDF</option>
                        <option value="cybersecurity">Cybersecurity</option>
                        <option value="tutorial">Tutorial</option>
                        <option value="certificate">Sertifikat</option>
                    </select>
                </div>

                <div>
                    <label class="form-group-label">File Saat Ini</label>
                    <p id="edit-project-current-file" style="color: var(--text-muted); font-size: 0.85rem;"></p>
                </div>

                <div>
                    <label class="form-group-label">Ganti File (Opsional)</label>
                    <input type="file" name="file" class="form-input">
                    <small class="form-help-text">Kosongkan jika tidak ingin mengganti file</small>
                </div>

                <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                    <button type="button" class="btn-secondary close-modal">Batal</button>
                    <button type="submit" class="btn">Simpan</button>
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
            <p>Apakah Anda yakin ingin menghapus project ini?</p>
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
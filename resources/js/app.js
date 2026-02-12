import '../css/app.css';
import './bootstrap';

document.addEventListener('DOMContentLoaded', function () {
    // === NAVBAR TOGGLE ===
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function () {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function (event) {
            const isClickInside = navToggle.contains(event.target) || navMenu.contains(event.target);

            if (!isClickInside && navMenu.classList.contains('active')) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });

        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function () {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // === TOAST NOTIFICATIONS ===
    const toasts = document.querySelectorAll('.toast');
    toasts.forEach(t => {
        setTimeout(() => {
            t.classList.add('hide');
            setTimeout(() => t.remove(), 500); // Remove from DOM after transition
        }, 5000);
    });

    // === DELETE CONFIRMATION MODAL ===
    const deleteForms = document.querySelectorAll('.delete-form-trigger');
    const modal = document.getElementById('confirmation-modal');
    const cancelBtn = document.getElementById('cancel-delete');
    const confirmForm = document.getElementById('delete-form-confirm');

    if (modal && confirmForm) {
        deleteForms.forEach(form => {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                // Set action of the confirmation form to match the triggered form
                confirmForm.action = this.action;
                modal.style.display = 'flex';
            });
        });

        if (cancelBtn) {
            cancelBtn.addEventListener('click', function () {
                modal.style.display = 'none';
            });
        }

        // Close when clicking outside
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // === BLOG MODALS ===
    const createModal = document.getElementById('create-blog-modal');
    const editModal = document.getElementById('edit-blog-modal');
    const openCreateBtn = document.getElementById('open-create-modal');

    // Open Create Modal
    if (openCreateBtn && createModal) {
        openCreateBtn.addEventListener('click', function () {
            createModal.style.display = 'flex';
        });
    }

    // Open Edit Modal — populate from data attributes
    document.querySelectorAll('.open-edit-modal').forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (!editModal) return;
            const form = document.getElementById('edit-blog-form');
            form.action = btn.dataset.updateUrl;
            document.getElementById('edit-title').value = btn.dataset.title || '';
            document.getElementById('edit-subtitle').value = btn.dataset.subtitle || '';
            document.getElementById('edit-content').value = btn.dataset.content || '';
            document.getElementById('edit-status').value = btn.dataset.status || 'draft';
            document.getElementById('edit-published_at').value = btn.dataset.publishedAt || '';

            // Image preview
            const preview = document.getElementById('edit-image-preview');
            const img = document.getElementById('edit-image-img');
            if (btn.dataset.image) {
                img.src = '/storage/' + btn.dataset.image;
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
            }

            editModal.style.display = 'flex';
        });
    });

    // Close modals — generic handler for all .close-modal buttons
    document.querySelectorAll('.close-modal').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const overlay = btn.closest('.modal-overlay');
            if (overlay) overlay.style.display = 'none';
        });
    });

    // Close modals on overlay click
    [createModal, editModal].forEach(function (m) {
        if (m) {
            m.addEventListener('click', function (e) {
                if (e.target === m) m.style.display = 'none';
            });
        }
    });

    // Close modals on ESC key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(function (m) {
                if (m && m.style.display === 'flex') m.style.display = 'none';
            });
        }
    });

    // === PROJECT MODALS ===
    const createProjectModal = document.getElementById('create-project-modal');
    const editProjectModal = document.getElementById('edit-project-modal');
    const openCreateProjectBtn = document.getElementById('open-create-project-modal');

    // Open Create Project Modal
    if (openCreateProjectBtn && createProjectModal) {
        openCreateProjectBtn.addEventListener('click', function () {
            createProjectModal.style.display = 'flex';
        });
    }

    // Open Edit Project Modal — populate from data attributes
    document.querySelectorAll('.open-edit-project-modal').forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (!editProjectModal) return;
            const form = document.getElementById('edit-project-form');
            form.action = btn.dataset.updateUrl;
            document.getElementById('edit-project-title').value = btn.dataset.title || '';
            document.getElementById('edit-project-description').value = btn.dataset.description || '';
            document.getElementById('edit-project-category').value = btn.dataset.category || '';
            document.getElementById('edit-project-current-file').textContent =
                (btn.dataset.filename || '') + ' (' + (btn.dataset.filesize || '') + ' KB)';

            editProjectModal.style.display = 'flex';
        });
    });

    // Close project modals on overlay click
    [createProjectModal, editProjectModal].forEach(function (m) {
        if (m) {
            m.addEventListener('click', function (e) {
                if (e.target === m) m.style.display = 'none';
            });
        }
    });
});

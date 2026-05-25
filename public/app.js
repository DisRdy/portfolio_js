document.addEventListener('DOMContentLoaded', function () {
    const showElement = function (element) {
        if (element) element.hidden = false;
    };

    const hideElement = function (element) {
        if (element) element.hidden = true;
    };

    const blockEditorInstances = new Map();
    const blockTypes = ['paragraph', 'heading', 'blockquote', 'code', 'image'];

    const defaultBlocks = function () {
        return [{ type: 'paragraph', value: '' }];
    };

    const parseBlocks = function (value) {
        try {
            const parsed = JSON.parse(value || '[]');
            if (!Array.isArray(parsed)) return defaultBlocks();
            const blocks = parsed
                .filter(block => block && blockTypes.includes(block.type))
                .map(block => ({
                    type: block.type,
                    value: block.value || '',
                    caption: block.caption || '',
                    language: block.language || '',
                }));
            return blocks.length ? blocks : defaultBlocks();
        } catch {
            return defaultBlocks();
        }
    };

    const blockPlaceholder = function (type) {
        if (type === 'heading') return 'Section heading';
        if (type === 'blockquote') return 'Quote text';
        if (type === 'code') return 'Paste code here';
        if (type === 'image') return '/storage/path/to/image.jpg or https://...';
        return 'Write a paragraph';
    };

    document.querySelectorAll('[data-block-editor]').forEach(function (editor) {
        const target = document.getElementById(editor.dataset.target);
        const list = editor.querySelector('.block-editor-list');
        if (!target || !list) return;

        let blocks = parseBlocks(target.value);

        const sync = function () {
            target.value = JSON.stringify(blocks);
        };

        const render = function () {
            list.textContent = '';

            blocks.forEach(function (block, index) {
                const row = document.createElement('div');
                row.className = 'block-editor-item';

                const header = document.createElement('div');
                header.className = 'block-editor-item-header';

                const select = document.createElement('select');
                blockTypes.forEach(function (type) {
                    const option = document.createElement('option');
                    option.value = type;
                    option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
                    option.selected = block.type === type;
                    select.appendChild(option);
                });
                select.addEventListener('change', function () {
                    blocks[index].type = select.value;
                    render();
                    sync();
                });

                const remove = document.createElement('button');
                remove.type = 'button';
                remove.textContent = 'Remove';
                remove.addEventListener('click', function () {
                    blocks.splice(index, 1);
                    if (!blocks.length) blocks = defaultBlocks();
                    render();
                    sync();
                });

                header.append(select, remove);

                const textarea = document.createElement('textarea');
                textarea.value = block.value || '';
                textarea.placeholder = blockPlaceholder(block.type);
                textarea.rows = block.type === 'code' ? 7 : 4;
                textarea.addEventListener('input', function () {
                    blocks[index].value = textarea.value;
                    sync();
                });

                row.append(header, textarea);

                if (block.type === 'code' || block.type === 'image') {
                    const meta = document.createElement('input');
                    meta.type = 'text';
                    meta.value = block.type === 'code' ? (block.language || '') : (block.caption || '');
                    meta.placeholder = block.type === 'code' ? 'Language label, e.g. typescript' : 'Image caption';
                    meta.addEventListener('input', function () {
                        if (block.type === 'code') {
                            blocks[index].language = meta.value;
                        } else {
                            blocks[index].caption = meta.value;
                        }
                        sync();
                    });
                    row.append(meta);
                }

                list.appendChild(row);
            });

            sync();
        };

        editor.querySelectorAll('[data-add-block]').forEach(function (button) {
            button.addEventListener('click', function () {
                blocks.push({ type: button.dataset.addBlock, value: '' });
                render();
            });
        });

        const instance = {
            setFromJson: function (value) {
                blocks = parseBlocks(value);
                render();
            },
        };

        blockEditorInstances.set(target.id, instance);
        render();
    });

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
                showElement(modal);
            });
        });

        if (cancelBtn) {
            cancelBtn.addEventListener('click', function () {
                hideElement(modal);
            });
        }

        // Close when clicking outside
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                hideElement(modal);
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
            showElement(createModal);
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
            document.getElementById('edit-category').value = btn.dataset.category || '';
            document.getElementById('edit-tags').value = btn.dataset.tags || '';
            document.getElementById('edit-image-caption').value = btn.dataset.imageCaption || '';
            const editBlocks = document.getElementById('edit-content-blocks');
            if (editBlocks) {
                editBlocks.value = btn.dataset.contentBlocks || '';
                blockEditorInstances.get('edit-content-blocks')?.setFromJson(editBlocks.value);
            }
            document.getElementById('edit-status').value = btn.dataset.status || 'draft';
            document.getElementById('edit-published_at').value = btn.dataset.publishedAt || '';

            // Image preview
            const preview = document.getElementById('edit-image-preview');
            const img = document.getElementById('edit-image-img');
            if (btn.dataset.image) {
                img.src = '/storage/' + btn.dataset.image;
                showElement(preview);
            } else {
                hideElement(preview);
            }

            showElement(editModal);
        });
    });

    // Close modals — generic handler for all .close-modal buttons
    document.querySelectorAll('.close-modal').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const overlay = btn.closest('.modal-overlay');
            hideElement(overlay);
        });
    });

    // Close modals on overlay click
    [createModal, editModal].forEach(function (m) {
        if (m) {
            m.addEventListener('click', function (e) {
                if (e.target === m) hideElement(m);
            });
        }
    });

    // Close modals on ESC key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(function (m) {
                if (m && !m.hidden) hideElement(m);
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
            showElement(createProjectModal);
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

            showElement(editProjectModal);
        });
    });

    // Close project modals on overlay click
    [createProjectModal, editProjectModal].forEach(function (m) {
        if (m) {
            m.addEventListener('click', function (e) {
                if (e.target === m) hideElement(m);
            });
        }
    });
});

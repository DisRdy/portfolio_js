document.addEventListener('DOMContentLoaded', function () {
    const showElement = function (element) {
        if (element) element.hidden = false;
    };

    const hideElement = function (element) {
        if (element) element.hidden = true;
    };

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

    const showClientToast = function (message) {
        const toast = document.createElement('div');
        toast.className = 'client-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        window.setTimeout(function () {
            toast.classList.add('hide');
            window.setTimeout(function () {
                toast.remove();
            }, 250);
        }, 2200);
    };

    const copyToClipboard = async function (value) {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(value);
            return;
        }

        const textarea = document.createElement('textarea');
        textarea.className = 'clipboard-copy-buffer';
        textarea.value = value;
        textarea.setAttribute('readonly', '');
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
    };

    document.querySelectorAll('[data-share-article]').forEach(function (button) {
        button.addEventListener('click', async function () {
            const shareData = {
                title: button.dataset.shareTitle || document.title,
                text: button.dataset.shareText || '',
                url: window.location.href,
            };

            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                    return;
                } catch (error) {
                    if (error && error.name === 'AbortError') {
                        return;
                    }
                }
            }

            await copyToClipboard(shareData.url);
            showClientToast('Link copied to clipboard!');
        });
    });

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

    // Open Edit Modal — populate from data attributes
    // Close modals — generic handler for all .close-modal buttons
    document.querySelectorAll('.close-modal').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const overlay = btn.closest('.modal-overlay');
            hideElement(overlay);
        });
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

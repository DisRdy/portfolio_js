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

    document.querySelectorAll('[data-password-toggle]').forEach(function (button) {
        const inputId = button.getAttribute('aria-controls');
        const input = inputId ? document.getElementById(inputId) : null;
        const icon = button.querySelector('.material-symbols-outlined');

        if (!input) return;

        const setPasswordVisible = function (isVisible) {
            input.type = isVisible ? 'text' : 'password';
            button.setAttribute('aria-pressed', String(isVisible));
            button.setAttribute('aria-label', isVisible ? 'Hide password' : 'Show password');
            button.setAttribute('title', isVisible ? 'Hide password' : 'Show password');
            if (icon) icon.textContent = isVisible ? 'visibility_off' : 'visibility';
        };

        button.addEventListener('click', function () {
            setPasswordVisible(input.type === 'password');
            input.focus({ preventScroll: true });
        });
    });

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

    const escapeHtml = function (value) {
        return String(value || '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    };

    const projectCategoryLabels = {
        website: 'Website',
        'data-analytics': 'Data & Analytics',
    };

    const projectCategoryLabel = function (category) {
        return projectCategoryLabels[category] || 'Website';
    };

    const formatKilobytes = function (bytes) {
        const kb = Number(bytes || 0) / 1024;
        return kb.toLocaleString('en-US', { maximumFractionDigits: 2 });
    };

    const formatProjectDate = function (value) {
        if (!value) return '-';
        const date = new Date(String(value).replace(' ', 'T'));
        if (Number.isNaN(date.getTime())) return '-';
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
        }).format(date);
    };

    const projectCardHtml = function (project) {
        const description = project.description
            ? escapeHtml(project.description)
            : 'Project PDF siap dibuka langsung dari portfolio collection.';

        return `<article class="project-card">
            <span class="project-card-external material-symbols-outlined">open_in_new</span>
            <span class="project-icon material-symbols-outlined">picture_as_pdf</span>
            <strong>${escapeHtml(project.title)}</strong>
            <small>${escapeHtml(projectCategoryLabel(project.category))}</small>
            <p>${description}</p>
            <span class="project-file">
                <span>${escapeHtml(project.originalFilename)}</span>
                <em>${escapeHtml(formatKilobytes(project.fileSize))} KB</em>
            </span>
            <a href="${escapeHtml(project.viewerUrl)}" class="project-view-button">View Project</a>
            <time>${escapeHtml(formatProjectDate(project.createdAt))}</time>
        </article>`;
    };

    const renderProjectSection = function (title, projects) {
        return `<section class="project-category-section">
            <div class="project-category-heading">
                <h2>${escapeHtml(title)}</h2>
                <span>${projects.length} project${projects.length === 1 ? '' : 's'}</span>
            </div>
            <div class="projects-grid">${projects.map(projectCardHtml).join('')}</div>
        </section>`;
    };

    const renderProjectList = function (projects, selectedCategory) {
        if (!projects.length) {
            const message = selectedCategory
                ? `Belum ada proyek dalam kategori <strong>${escapeHtml(projectCategoryLabel(selectedCategory))}</strong>.`
                : 'Belum ada proyek yang diupload.';
            return `<div class="projects-empty"><p>${message}</p></div>`;
        }

        if (selectedCategory) {
            return renderProjectSection(projectCategoryLabel(selectedCategory), projects);
        }

        const orderedCategories = ['website', 'data-analytics'];
        const rendered = orderedCategories
            .map(function (category) {
                const group = projects.filter(function (project) {
                    return project.category === category;
                });
                return group.length ? renderProjectSection(projectCategoryLabel(category), group) : '';
            })
            .filter(Boolean)
            .join('');

        return rendered || `<div class="projects-empty"><p>Belum ada proyek yang cocok dengan kategori portfolio saat ini.</p></div>`;
    };

    document.querySelectorAll('[data-project-list]').forEach(function (container) {
        const selectedCategory = container.dataset.selectedCategory || '';
        const endpoint = new URL('/api/projects', window.location.origin);
        if (selectedCategory) endpoint.searchParams.set('category', selectedCategory);

        const loadProjects = async function () {
            container.innerHTML = `<div class="projects-loading">
                <span class="material-symbols-outlined">hourglass_empty</span>
                <p>Loading projects...</p>
            </div>`;

            try {
                const response = await fetch(endpoint.toString());
                if (!response.ok) {
                    throw new Error('Unable to load projects.');
                }

                const payload = await response.json();
                const projects = Array.isArray(payload.projects) ? payload.projects : [];
                container.innerHTML = renderProjectList(projects, selectedCategory);
            } catch (error) {
                container.innerHTML = `<div class="projects-empty">
                    <p>Gagal memuat project. Silakan refresh halaman.</p>
                </div>`;
            }
        };

        loadProjects();
    });

    document.querySelectorAll('[data-project-modal-root]').forEach(function (root) {
        const modalBackdrop = root.querySelector('[data-project-modal]');
        const modal = modalBackdrop ? modalBackdrop.querySelector('.project-modal') : null;
        const openButtons = root.querySelectorAll('[data-project-modal-open]');
        const closeButtons = root.querySelectorAll('[data-project-modal-close]');
        const pageLabel = root.querySelector('[data-project-page-label]');
        const prevButton = root.querySelector('[data-project-page-prev]');
        const nextButton = root.querySelector('[data-project-page-next]');
        const totalPages = Math.max(1, Number(root.dataset.totalPages || 1));
        let currentPage = 1;
        let closeTimer = null;

        if (!modalBackdrop || !modal) return;

        const syncPageLabel = function () {
            if (pageLabel) pageLabel.textContent = `Halaman ${currentPage} / ${totalPages}`;
            if (prevButton) prevButton.disabled = currentPage <= 1;
            if (nextButton) nextButton.disabled = currentPage >= totalPages;
        };

        const openModal = function () {
            if (closeTimer) window.clearTimeout(closeTimer);
            modalBackdrop.hidden = false;
            document.body.style.overflow = 'hidden';
            syncPageLabel();
            window.requestAnimationFrame(function () {
                modalBackdrop.classList.add('is-open');
            });
        };

        const closeModal = function () {
            modalBackdrop.classList.remove('is-open');
            document.body.style.overflow = '';
            closeTimer = window.setTimeout(function () {
                modalBackdrop.hidden = true;
            }, 180);
        };

        openButtons.forEach(function (button) {
            button.addEventListener('click', openModal);
        });

        closeButtons.forEach(function (button) {
            button.addEventListener('click', closeModal);
        });

        modalBackdrop.addEventListener('click', function (event) {
            if (event.target === modalBackdrop) closeModal();
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && !modalBackdrop.hidden) {
                closeModal();
            }
        });

        if (prevButton) {
            prevButton.addEventListener('click', function () {
                currentPage = Math.max(1, currentPage - 1);
                syncPageLabel();
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', function () {
                currentPage = Math.min(totalPages, currentPage + 1);
                syncPageLabel();
            });
        }

        syncPageLabel();
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
            const isOpen = this.classList.toggle('active');
            navMenu.classList.toggle('active', isOpen);
            this.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function (event) {
            const isClickInside = navToggle.contains(event.target) || navMenu.contains(event.target);

            if (!isClickInside && navMenu.classList.contains('active')) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });

        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function () {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
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

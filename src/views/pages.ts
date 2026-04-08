import type { Blog, Comment, DashboardSummary, FlashData, Project, User } from "../types";
import {
  baseOldValues,
  escapeAttribute,
  escapeHtml,
  formatDateBlog,
  formatDateLong,
  formatDateLongTime,
  formatDateShort,
  formatKilobytes,
  htmlDocument,
  renderToast,
  renderValidationError,
  storageUrl,
  truncate,
} from "../lib/utils";

function publicNavbar(active: "home" | "projects" | "blog" | "comments"): string {
  return `<nav class="kof-navbar">
    <div class="navbar-container">
        <div class="navbar-brand">
            <a href="/" class="brand-link">
                <span class="brand-text">Dr</span>
            </a>
        </div>

        <button class="navbar-toggle" id="navToggle" aria-label="Toggle Navigation">
            <span class="toggle-line"></span>
            <span class="toggle-line"></span>
            <span class="toggle-line"></span>
        </button>

        <div class="navbar-menu" id="navMenu">
            <a href="/" class="nav-link ${active === "home" ? "active" : ""}">
                <span class="nav-text">Home</span>
            </a>
            <a href="/projects" class="nav-link ${active === "projects" ? "active" : ""}">
                <span class="nav-text">Projects</span>
            </a>
            <a href="/blog" class="nav-link ${active === "blog" ? "active" : ""}">
                <span class="nav-text">Blog</span>
            </a>
            <a href="/comments" class="nav-link ${active === "comments" ? "active" : ""}">
                <span class="nav-text">Comments</span>
            </a>
        </div>
    </div>
    <div class="navbar-line"></div>
</nav>`;
}

function dashboardNavbar(active: "dashboard" | "projects" | "blogs", csrfToken: string): string {
  return `<nav class="kof-navbar dashboard-navbar">
    <div class="navbar-container">
        <div class="navbar-brand">
            <a href="/dashboard" class="brand-link">
                <span class="brand-text">Dr</span>
            </a>
        </div>

        <button class="navbar-toggle" id="navToggle" aria-label="Toggle Navigation">
            <span class="toggle-line"></span>
            <span class="toggle-line"></span>
            <span class="toggle-line"></span>
        </button>

        <div class="navbar-menu" id="navMenu">
            <a href="/dashboard" class="nav-link ${active === "dashboard" ? "active" : ""}">
                <span class="nav-text">Dashboard</span>
            </a>
            <a href="/dashboard/projects" class="nav-link ${active === "projects" ? "active" : ""}">
                <span class="nav-text">Projects</span>
            </a>
            <a href="/dashboard/blogs" class="nav-link ${active === "blogs" ? "active" : ""}">
                <span class="nav-text">Blogs</span>
            </a>
            <form method="POST" action="/logout" class="nav-link-form">
                <input type="hidden" name="_token" value="${escapeAttribute(csrfToken)}">
                <button type="submit" class="nav-link btn-logout-nav">
                    <span class="nav-text">Logout</span>
                </button>
            </form>
        </div>
    </div>
    <div class="navbar-line"></div>
</nav>`;
}

function footer(text: string): string {
  return `<footer>
        <p>${text}</p>
    </footer>`;
}

function publicLayout(title: string, active: "home" | "projects" | "blog" | "comments", body: string, footerText: string): string {
  return htmlDocument(title, `${publicNavbar(active)}${body}${footer(footerText)}`);
}

function oldValue(old: Record<string, string> | undefined, key: string): string {
  return old?.[key] ?? "";
}

function selectedValue(old: Record<string, string> | undefined, key: string, value: string): string {
  return oldValue(old, key) === value ? "selected" : "";
}

export function renderHomePage(): string {
  return publicLayout(
    "Dr",
    "home",
    `<header>
        <p class="brand-ts">Hi, Welcome!</p>
    </header>

    <div class="container">
        <section>
            <h2>Me? <span class="brand-ts-2xl">Disna Radita</span></h2>
            <p>My background is in Laravel, with growing focus on penetration testing, and Web3.<br>
                I have experience building web applications with Laravel. Now I'm also expanding my knowledge in Web3.
            </p>
        </section>

        <section>
            <h2>Technical Skills</h2>
            <div class="skills-list">
                <div class="skill-item">
                    <strong>None</strong>
                    <p>Huftssss</p>
                </div>
                <div class="skill-item">
                    <strong>None</strong>
                    <p>Huftssss</p>
                </div>
                <div class="skill-item">
                    <strong>None</strong>
                    <p>Huftssss</p>
                </div>
            </div>
        </section>

        <section>
            <h2>Experience</h2>
            <p>I've worked on a variety of projects, from small applications to more complex systems. This experience
                has taught me the importance of clean code and documentation.</p>
            <ul>
                <li>Been a driver at FinExpress for 3 years (Work)</li>
                <li>Make a full-stack web applications with Laravel (Project)</li>
                <li>Database design and optimization (Project)</li>
            </ul>
        </section>

        <section id="skills">
            <h2>Skills</h2>
            <ul>
                <li>Linux Tools</li>
                <li>Penetration Testing</li>
                <li>Web Dev</li>
                <li>IT Support</li>
            </ul>
        </section>

        <section id="contact">
            <h2>Contact</h2>
            <p>If you're interested in collaborating or just want to say hello, feel free to reach out to me:</p>
            <p>
                Email: <a href="mailto:disnaraditya@gmail.com">disnaraditya@gmail.com</a><br>
                GitHub: <a href="https://github.com/DisRdy" target="_blank">My github</a><br>
                Dev: <a href="https://dev.to/lamp" target="_blank">Dev community</a> <br>
                Instagram: <a href="https://www.instagram.com/dsnardy?igsh=bDNubXduNmNsYTM1" target="_blank">My
                    Instagram</a>
            </p>
        </section>
    </div>`,
    "&copy; 2025 Dr",
  );
}

export function renderCommentsPage(options: {
  comments: Comment[];
  currentUser: User | null;
  flash: FlashData;
  csrfToken: string;
}): string {
  const { comments, currentUser, flash, csrfToken } = options;
  const errors = flash.errors;
  return publicLayout(
    "Comments",
    "comments",
    `<header>
        <p class="brand-ts">Comments & suggestion</p>
    </header>

    ${renderToast(flash)}

    <div class="container">
        <div>
            <div class="main-content" id="comments">
                <div class="comment-form-wrapper">
                    <div class="comment-form-section">
                        <div class="comment-limit-info"></div>
                        <h3>Tulis Komentar</h3>

                        <form method="POST" action="/comments">
                            <input type="hidden" name="_token" value="${escapeAttribute(csrfToken)}">
                            <div>
                                <label for="name" class="form-group-label">Name</label>
                                <input type="text" id="name" name="name" required maxlength="255"
                                    placeholder="Masukkan nama Anda" class="form-input">
                                ${renderValidationError(errors, "name")}
                            </div>

                            <div>
                                <label for="comment" class="form-group-label">Komentar Anda</label>
                                <textarea id="comment" name="comment" required maxlength="1000" rows="5"
                                    placeholder="Bagikan pemikiran, saran, atau pertanyaan Anda..."
                                    class="form-textarea"></textarea>
                                <small class="form-help-text">Maksimal 1000 karakter</small>
                                ${renderValidationError(errors, "comment")}
                            </div>

                            <button type="submit" class="btn">
                                Kirim Komentar
                            </button>
                        </form>
                    </div>

                    <div>
                        <h3 class="comment-list-title">Daftar Komentar (${comments.length})</h3>

                        ${comments.length > 0 ? `<div class="comment-list">
                            ${comments.map((comment) => `<div class="comment-item">
                                    <div class="comment-meta">
                                        <div>
                                            <h4>${escapeHtml(comment.name)}</h4>
                                            <p class="comment-date">
                                                ${escapeHtml(formatDateLongTime(comment.createdAt))}
                                            </p>
                                        </div>
                                        ${currentUser && currentUser.id === comment.userId ? `<span class="comment-author-badge">Anda</span>` : ""}
                                    </div>
                                    <p class="comment-text">${escapeHtml(comment.comment)}</p>
                                </div>`).join("")}
                        </div>` : `<div class="empty-state">
                            <p>Belum ada komentar. Jadilah yang pertama memberikan komentar!</p>
                        </div>`}
                    </div>
                </div>
            </div>
        </div>
    </div>`,
    "&copy; 2025 Dr",
  );
}

export function renderLoginPage(flash: FlashData, csrfToken: string): string {
  const errors = flash.errors;
  const old = flash.old;
  return htmlDocument(
    "Login",
    `<div class="container">
        <section class="auth-wrapper">
            <h2>Login</h2>

            <form method="POST" action="/login">
                <input type="hidden" name="_token" value="${escapeAttribute(csrfToken)}">

                <div>
                    <label for="email" class="form-group-label">Email</label>
                    <input type="email" name="email" id="email" value="${escapeAttribute(oldValue(old, "email"))}" required autofocus
                        class="form-input">
                    ${renderValidationError(errors, "email", "text-red-500 text-sm")}
                </div>

                <div>
                    <label for="password" class="form-group-label">Password</label>
                    <input type="password" name="password" id="password" required class="form-input">
                    ${renderValidationError(errors, "password", "text-red-500 text-sm")}
                </div>

                <button type="submit" class="btn">
                    Log In
                </button>
            </form>
        </section>
    </div>`,
  );
}

export function renderRegisterPage(flash: FlashData, csrfToken: string): string {
  const errors = flash.errors;
  const old = flash.old;
  return htmlDocument(
    "Register",
    `<div class="container">
        <section class="auth-wrapper">
            <h2>Create Your Account</h2>

            <form method="POST" action="/register">
                <input type="hidden" name="_token" value="${escapeAttribute(csrfToken)}">

                <div>
                    <label for="name" class="form-group-label">Full Name</label>
                    <input type="text" name="name" id="name" value="${escapeAttribute(oldValue(old, "name"))}" required autofocus
                        class="form-input">
                    ${renderValidationError(errors, "name", "text-red-500 text-sm")}
                </div>

                <div>
                    <label for="email" class="form-group-label">Email Address</label>
                    <input type="email" name="email" id="email" value="${escapeAttribute(oldValue(old, "email"))}" required 
                        class="form-input">
                    ${renderValidationError(errors, "email", "text-red-500 text-sm")}
                </div>

                <div>
                    <label for="password" class="form-group-label">Password</label>
                    <input type="password" name="password" id="password" required class="form-input">
                    ${renderValidationError(errors, "password", "text-red-500 text-sm")}
                </div>

                <div>
                    <label for="password_confirmation" class="form-group-label">Confirm Password</label>
                    <input type="password" name="password_confirmation" id="password_confirmation" required class="form-input">
                    ${renderValidationError(errors, "password_confirmation", "text-red-500 text-sm")}
                </div>

                <button type="submit" class="btn">
                    Register
                </button>
            </form>

            <p class="text-center mt-4">
                Already have an account? <a href="/login" class="link">Login here</a>
            </p>
        </section>
    </div>`,
  );
}

function publicProjectCard(project: Project): string {
  return `<div class="project-card">
        <div class="project-header">
            <h4>${escapeHtml(project.title)}</h4>
            <p class="project-date">${escapeHtml(formatDateLong(project.createdAt))}</p>
        </div>
        <div class="project-body">
            ${project.description ? `<p>${escapeHtml(truncate(project.description, 150))}</p>` : ""}
            <div class="file-info">
                <p><strong>${escapeHtml(project.originalFilename)}</strong></p>
                <small>${escapeHtml(formatKilobytes(project.fileSize))} KB</small>
            </div>
            <a href="/project/${project.id}/download" class="btn">Download File</a>
        </div>
    </div>`;
}

export function renderProjectsPage(projects: Project[], selectedCategory: string | null): string {
  const groupedProjects = new Map<string, Project[]>();
  for (const project of projects) {
    const list = groupedProjects.get(project.category) ?? [];
    list.push(project);
    groupedProjects.set(project.category, list);
  }

  const categoryLabels: Record<string, string> = {
    design: "Design",
    pdf: "Dokumentasi",
    tutorial: "Tutorial IT",
    certificate: "Sertifikat",
  };

  let content = "";
  if (projects.length === 0) {
    content = `<div class="alert alert-info">
                    <p>
                        ${selectedCategory
      ? `Belum ada proyek dalam kategori <strong>${escapeHtml(selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1))}</strong>.`
      : "Belum ada proyek yang diupload."}
                    </p>
                </div>`;
  } else if (selectedCategory) {
    const label = categoryLabels[selectedCategory] ?? `${selectedCategory.charAt(0).toUpperCase()}${selectedCategory.slice(1)}`;
    content = `<div>
                        <h3 class="category-title">${escapeHtml(label)}</h3>
                        <p class="category-count">Total: <strong>${projects.length}</strong> proyek</p>
                        <div class="grid-auto-lg">
                            ${projects.map(publicProjectCard).join("")}
                        </div>
                    </div>`;
  } else {
    content = ([
      ["design", "Design"],
      ["pdf", "Dokumentasi"],
      ["tutorial", "Tutorial IT"],
      ["certificate", "Sertifikat"],
    ] as const).map(([key, label]) => {
      const group = groupedProjects.get(key);
      if (!group?.length) {
        return "";
      }

      return `<div>
                <h3 class="category-title">${escapeHtml(label)}</h3>
                <p class="category-count">Total: <strong>${group.length}</strong></p>
                <div class="grid-auto-lg">
                    ${group.map(publicProjectCard).join("")}
                </div>
            </div>`;
    }).join("");
  }

  return publicLayout(
    "Project",
    "projects",
    `<header>
        <p class="brand-ts">My Collection</p>
    </header>

    <div class="container">
        <section>
            <h2>Projects</h2>

            <div class="category-nav">
                <span class="category-label">Filter Kategori:</span>
                <a href="/projects" class="${selectedCategory ? "" : "active"}">Semua Kategori</a>
                <a href="/projects?category=design" class="${selectedCategory === "design" ? "active" : ""}">Design</a>
                <a href="/projects?category=pdf" class="${selectedCategory === "pdf" ? "active" : ""}">Dokumentasi</a>
                <a href="/projects?category=tutorial" class="${selectedCategory === "tutorial" ? "active" : ""}">Tutorial IT</a>
                <a href="/projects?category=certificate" class="${selectedCategory === "certificate" ? "active" : ""}">Sertifikat</a>
            </div>

            ${content}
        </section>
    </div>`,
    "&copy; 2025 Dr",
  );
}

export function renderDashboardPage(summary: DashboardSummary, csrfToken: string, flash: FlashData): string {
  return htmlDocument(
    "Dashboard",
    `${dashboardNavbar("dashboard", csrfToken)}
    ${renderToast(flash)}

    <div class="dashboard-wrapper">
        <div class="container">
            <div class="dashboard-header">
                <div class="dashboard-title">
                    <h1>Dashboard</h1>
                </div>
                <hr class="divider">
            </div>

            <div class="summary-grid">
                <a href="/dashboard/projects" class="summary-card">
                    <div class="summary-icon"></div>
                    <div class="summary-info">
                        <span class="summary-count">${summary.projectCount}</span>
                        <span class="summary-label">Projects</span>
                    </div>
                </a>

                <a href="/dashboard/blogs" class="summary-card">
                    <div class="summary-icon"></div>
                    <div class="summary-info">
                        <span class="summary-count">${summary.blogCount}</span>
                        <span class="summary-label">Blog Posts</span>
                    </div>
                </a>

                <div class="summary-card">
                    <div class="summary-icon"></div>
                    <div class="summary-info">
                        <span class="summary-count">${summary.publishedBlogCount}</span>
                        <span class="summary-label">Published</span>
                    </div>
                </div>

                <div class="summary-card">
                    <div class="summary-icon"></div>
                    <div class="summary-info">
                        <span class="summary-count">${summary.draftBlogCount}</span>
                        <span class="summary-label">Drafts</span>
                    </div>
                </div>
            </div>

            <div class="dashboard-section">
                <div class="section-header">
                    <h3>Recent Projects</h3>
                    <a href="/dashboard/projects" class="section-link">View All &rarr;</a>
                </div>
                ${summary.recentProjects.length === 0 ? `<p class="empty-text">No projects yet.</p>` : `<div class="project-list">
                    ${summary.recentProjects.map((project) => `<div class="project-item">
                            <div class="project-item-info">
                                <h5>${escapeHtml(project.title)}</h5>
                                <p class="file-details">
                                    ${escapeHtml(project.category)} &bull;
                                    ${escapeHtml(project.originalFilename)}
                                </p>
                            </div>
                        </div>`).join("")}
                </div>`}
            </div>

            <div class="dashboard-section">
                <div class="section-header">
                    <h3>Recent Blogs</h3>
                    <a href="/dashboard/blogs" class="section-link">View All &rarr;</a>
                </div>
                ${summary.recentBlogs.length === 0 ? `<p class="empty-text">No blog posts yet.</p>` : `<div class="project-list">
                    ${summary.recentBlogs.map((blog) => `<div class="project-item">
                            <div class="project-item-info">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <h5>${escapeHtml(blog.title)}</h5>
                                    <span class="badge ${blog.status === "published" ? "badge-success" : "badge-warning"}">
                                        ${escapeHtml(blog.status.charAt(0).toUpperCase() + blog.status.slice(1))}
                                    </span>
                                </div>
                                <p class="file-details">
                                    ${blog.publishedAt ? escapeHtml(formatDateShort(blog.publishedAt)) : "Not published"}
                                </p>
                            </div>
                        </div>`).join("")}
                </div>`}
            </div>

        </div>
    </div>

    ${footer("&copy; 2025 Dr")}`,
  );
}

export function renderDashboardProjectsPage(options: {
  projects: Project[];
  flash: FlashData;
  csrfToken: string;
}): string {
  const { projects, flash, csrfToken } = options;
  const errors = flash.errors;
  const old = baseOldValues(flash.old, ["title", "description", "category"]);
  const groupedProjects = new Map<string, Project[]>();
  for (const project of projects) {
    const list = groupedProjects.get(project.category) ?? [];
    list.push(project);
    groupedProjects.set(project.category, list);
  }

  return htmlDocument(
    "Manage Projects - Dashboard",
    `${dashboardNavbar("projects", csrfToken)}
    ${renderToast(flash)}

    <div class="dashboard-wrapper">
        <div class="container">
            <div class="dashboard-header">
                <div class="dashboard-title">
                    <h1>Manage Projects</h1>
                    <button type="button" class="btn" style="margin-left: auto; width: auto;" id="open-create-project-modal">
                        + New Project
                    </button>
                </div>
                <hr class="divider">
            </div>

            ${projects.length === 0 ? `<div class="empty-state"><p>Anda belum memiliki project. Upload project pertama Anda!</p></div>` : ([
      ["design", "Design"],
      ["pdf", "Dokumentasi"],
      ["cybersecurity", "Cybersecurity"],
      ["tutorial", "Tutorial IT"],
      ["certificate", "Sertifikat"],
    ] as const).map(([key, label]) => {
      const group = groupedProjects.get(key);
      if (!group?.length) {
        return "";
      }

      return `<div class="project-list-section">
                            <h4 class="category-section-title">${escapeHtml(label)}</h4>
                            <div class="project-list">
                                ${group.map((project) => `<div class="project-item">
                                        <div class="project-item-info">
                                            <h5>${escapeHtml(project.title)}</h5>
                                            ${project.description ? `<p>${escapeHtml(truncate(project.description, 100))}</p>` : ""}
                                            <p class="file-details">
                                                ${escapeHtml(project.originalFilename)}
                                                (${escapeHtml(formatKilobytes(project.fileSize))} KB)
                                            </p>
                                            <div class="project-item-actions">
                                                <button type="button" class="btn-edit open-edit-project-modal"
                                                    data-id="${project.id}" data-title="${escapeAttribute(project.title)}"
                                                    data-description="${escapeAttribute(project.description ?? "")}"
                                                    data-category="${escapeAttribute(project.category)}"
                                                    data-filename="${escapeAttribute(project.originalFilename)}"
                                                    data-filesize="${escapeAttribute(formatKilobytes(project.fileSize))}"
                                                    data-update-url="/dashboard/projects/${project.id}">
                                                    Edit
                                                </button>
                                                <form action="/dashboard/projects/${project.id}" method="POST"
                                                    class="delete-form-trigger">
                                                    <input type="hidden" name="_token" value="${escapeAttribute(csrfToken)}">
                                                    <input type="hidden" name="_method" value="DELETE">
                                                    <button type="submit" class="btn-delete">Hapus</button>
                                                </form>
                                            </div>
                                        </div>
                                    </div>`).join("")}
                            </div>
                        </div>`;
    }).join("")}

            <a href="/dashboard" class="btn-secondary" style="margin-top: 2rem;">
                &larr; Back to Dashboard
            </a>
        </div>
    </div>

    <div id="create-project-modal" class="modal-overlay" style="display: none;">
        <div class="modal-content modal-content-lg">
            <div class="modal-header">
                <h2>Upload Project Baru</h2>
                <button type="button" class="modal-close close-modal">&times;</button>
            </div>

            <form action="/dashboard/projects" method="POST" enctype="multipart/form-data">
                <input type="hidden" name="_token" value="${escapeAttribute(csrfToken)}">

                <div>
                    <label class="form-group-label">Judul Project</label>
                    <input type="text" name="title" class="form-input" placeholder="Masukkan judul project"
                        value="${escapeAttribute(oldValue(old, "title"))}" required>
                    ${renderValidationError(errors, "title")}
                </div>

                <div>
                    <label class="form-group-label">Deskripsi (Opsional)</label>
                    <textarea name="description" class="form-textarea"
                        placeholder="Deskripsi singkat project">${escapeHtml(oldValue(old, "description"))}</textarea>
                    ${renderValidationError(errors, "description")}
                </div>

                <div>
                    <label class="form-group-label">Kategori</label>
                    <select name="category" class="form-input" required>
                        <option value="">-- Pilih Kategori --</option>
                        <option value="design" ${selectedValue(old, "category", "design")}>Design</option>
                        <option value="pdf" ${selectedValue(old, "category", "pdf")}>PDF</option>
                        <option value="cybersecurity" ${selectedValue(old, "category", "cybersecurity")}>Cybersecurity</option>
                        <option value="tutorial" ${selectedValue(old, "category", "tutorial")}>Tutorial</option>
                        <option value="certificate" ${selectedValue(old, "category", "certificate")}>Sertifikat</option>
                    </select>
                    ${renderValidationError(errors, "category")}
                </div>

                <div>
                    <label class="form-group-label">File (Max 10MB)</label>
                    <input type="file" name="file" class="form-input" required>
                    ${renderValidationError(errors, "file")}
                </div>

                <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                    <button type="button" class="btn-secondary close-modal">Batal</button>
                    <button type="submit" class="btn">Upload Project</button>
                </div>
            </form>
        </div>
    </div>

    <div id="edit-project-modal" class="modal-overlay" style="display: none;">
        <div class="modal-content modal-content-lg">
            <div class="modal-header">
                <h2>Edit Project</h2>
                <button type="button" class="modal-close close-modal">&times;</button>
            </div>

            <form id="edit-project-form" method="POST" enctype="multipart/form-data">
                <input type="hidden" name="_token" value="${escapeAttribute(csrfToken)}">
                <input type="hidden" name="_method" value="PUT">

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

    <div id="confirmation-modal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Konfirmasi Hapus</h2>
            </div>
            <p>Apakah Anda yakin ingin menghapus project ini?</p>
            <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                <button id="cancel-delete" class="btn-secondary">Batal</button>
                <form id="delete-form-confirm" method="POST">
                    <input type="hidden" name="_token" value="${escapeAttribute(csrfToken)}">
                    <input type="hidden" name="_method" value="DELETE">
                    <button type="submit" class="btn-delete">Ya, Hapus</button>
                </form>
            </div>
        </div>
    </div>`,
  );
}

export function renderBlogIndexPage(blogs: Blog[]): string {
  return publicLayout(
    "Blog - Dr",
    "blog",
    `<header>
        <p class="brand-ts">Thoughts & Articles</p>
    </header>

    <div class="container">
        <section>
            <h2 style="margin-bottom: 2rem;">Latest Posts</h2>

            ${blogs.length === 0 ? `<div class="alert alert-info">
                <p>No posts published yet. Check back later!</p>
            </div>` : `<div class="blog-list">
                ${blogs.map((blog) => `<div class="blog-card project-card">
                        <div class="project-body">
                            <a href="/blog/${encodeURIComponent(blog.slug)}" class="blog-link">
                                <h3 class="blog-title">${escapeHtml(blog.title)}</h3>
                            </a>
                            ${blog.subtitle ? `<p class="blog-subtitle">${escapeHtml(blog.subtitle)}</p>` : ""}
                            <small class="blog-date">
                                ${escapeHtml(formatDateBlog(blog.publishedAt))}
                            </small>
                        </div>
                    </div>`).join("")}
            </div>`}
        </section>
    </div>`,
    `&copy; ${new Date().getUTCFullYear()} Dr`,
  );
}

export function renderBlogShowPage(blog: Blog): string {
  return publicLayout(
    `${blog.title} - Dr`,
    "blog",
    `<div class="container blog-detail-container">
        <article class="blog-article">
            <header class="blog-header">
                <h1 class="article-title">${escapeHtml(blog.title)}</h1>
                ${blog.subtitle ? `<p class="article-subtitle">${escapeHtml(blog.subtitle)}</p>
                    ${blog.image ? `<div class="article-image-container" style="margin-bottom: 2rem;">
                            <img src="${escapeAttribute(storageUrl(blog.image))}" alt="${escapeAttribute(blog.title)}" class="article-image"
                                style="width: 100%; max-height: 400px; object-fit: cover; border-radius: var(--radius-lg); border: 1px solid var(--glass-border);">
                        </div>` : ""}` : ""}
                <div class="article-meta">
                    <span>Published on ${escapeHtml(formatDateBlog(blog.publishedAt))}</span>
                </div>
            </header>

            <div class="article-content">
                ${escapeHtml(blog.content).replaceAll("\n", "<br>")}
            </div>

            <div class="article-footer">
                <a href="/blog" class="btn-secondary">
                    &larr; Back to Articles
                </a>
            </div>
        </article>
    </div>`,
    `&copy; ${new Date().getUTCFullYear()} Dr`,
  );
}

export function renderDashboardBlogsPage(options: {
  blogs: Blog[];
  flash: FlashData;
  csrfToken: string;
}): string {
  const { blogs, flash, csrfToken } = options;
  const errors = flash.errors;
  const old = baseOldValues(flash.old, ["title", "subtitle", "content", "status", "published_at"]);

  return htmlDocument(
    "Manage Blogs - Dashboard",
    `${dashboardNavbar("blogs", csrfToken)}
    ${renderToast(flash)}

    <div class="dashboard-wrapper">
        <div class="container">
            <div class="dashboard-header">
                <div class="dashboard-title">
                    <h1>Manage Blogs</h1>
                    <button type="button" class="btn" style="margin-left: auto; width: auto;" id="open-create-modal">
                        + New Post
                    </button>
                </div>
                <hr class="divider">
            </div>

            <div class="project-list">
                ${blogs.length > 0 ? blogs.map((blog) => `<div class="project-item">
                        <div class="project-item-info">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 0.5rem;">
                                <h5>${escapeHtml(blog.title)}</h5>
                                <span class="badge ${blog.status === "published" ? "badge-success" : "badge-warning"}">
                                    ${escapeHtml(blog.status.charAt(0).toUpperCase() + blog.status.slice(1))}
                                </span>
                            </div>
                            ${blog.subtitle ? `<p>${escapeHtml(truncate(blog.subtitle, 80))}</p>` : ""}
                            <p class="file-details">
                                <small>Published: ${blog.publishedAt ? escapeHtml(formatDateShort(blog.publishedAt)) : "-"}</small>
                            </p>

                            <div class="project-item-actions">
                                <button type="button" class="btn-edit open-edit-modal" data-id="${blog.id}"
                                    data-title="${escapeAttribute(blog.title)}" data-subtitle="${escapeAttribute(blog.subtitle ?? "")}"
                                    data-content="${escapeAttribute(blog.content)}" data-status="${escapeAttribute(blog.status)}"
                                    data-published-at="${escapeAttribute(blog.publishedAt ? blog.publishedAt.replace(" ", "T").slice(0, 16) : "")}"
                                    data-image="${escapeAttribute(blog.image ?? "")}"
                                    data-update-url="/dashboard/blogs/${blog.id}">
                                    Edit
                                </button>
                                <form action="/dashboard/blogs/${blog.id}" method="POST" class="delete-form-trigger">
                                    <input type="hidden" name="_token" value="${escapeAttribute(csrfToken)}">
                                    <input type="hidden" name="_method" value="DELETE">
                                    <button type="submit" class="btn-delete">Delete</button>
                                </form>
                            </div>
                        </div>
                    </div>`).join("") : `<div class="empty-state">
                    <p>You haven't created any blog posts yet.</p>
                </div>`}
            </div>

            <a href="/dashboard" class="btn-secondary" style="margin-top: 2rem;">
                &larr; Back to Dashboard
            </a>
        </div>
    </div>

    <div id="create-blog-modal" class="modal-overlay" style="display: none;">
        <div class="modal-content modal-content-lg">
            <div class="modal-header">
                <h2>Create New Post</h2>
                <button type="button" class="modal-close close-modal">&times;</button>
            </div>

            <form action="/dashboard/blogs" method="POST" enctype="multipart/form-data">
                <input type="hidden" name="_token" value="${escapeAttribute(csrfToken)}">

                <div>
                    <label for="create-title" class="form-group-label">Title</label>
                    <input type="text" name="title" id="create-title" class="form-input" value="${escapeAttribute(oldValue(old, "title"))}"
                        required>
                    ${renderValidationError(errors, "title")}
                </div>

                <div>
                    <label for="create-subtitle" class="form-group-label">Subtitle (Optional)</label>
                    <input type="text" name="subtitle" id="create-subtitle" class="form-input"
                        value="${escapeAttribute(oldValue(old, "subtitle"))}">
                    ${renderValidationError(errors, "subtitle")}
                </div>

                <div>
                    <label for="create-image" class="form-group-label">Cover Image (Optional)</label>
                    <input type="file" name="image" id="create-image" class="form-input" accept="image/*">
                    ${renderValidationError(errors, "image")}
                </div>

                <div>
                    <label for="create-content" class="form-group-label">Content</label>
                    <textarea name="content" id="create-content" class="form-textarea" required
                        rows="8">${escapeHtml(oldValue(old, "content"))}</textarea>
                    ${renderValidationError(errors, "content")}
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label for="create-status" class="form-group-label">Status</label>
                        <select name="status" id="create-status" class="form-input">
                            <option value="draft" ${selectedValue(old, "status", "draft")}>Draft</option>
                            <option value="published" ${selectedValue(old, "status", "published")}>Published</option>
                        </select>
                    </div>
                    <div>
                        <label for="create-published_at" class="form-group-label">Published At</label>
                        <input type="datetime-local" name="published_at" id="create-published_at" class="form-input"
                            value="${escapeAttribute(oldValue(old, "published_at"))}">
                    </div>
                </div>

                <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                    <button type="button" class="btn-secondary close-modal">Cancel</button>
                    <button type="submit" class="btn">Create Post</button>
                </div>
            </form>
        </div>
    </div>

    <div id="edit-blog-modal" class="modal-overlay" style="display: none;">
        <div class="modal-content modal-content-lg">
            <div class="modal-header">
                <h2>Edit Post</h2>
                <button type="button" class="modal-close close-modal">&times;</button>
            </div>

            <form id="edit-blog-form" method="POST" enctype="multipart/form-data">
                <input type="hidden" name="_token" value="${escapeAttribute(csrfToken)}">
                <input type="hidden" name="_method" value="PUT">

                <div>
                    <label for="edit-title" class="form-group-label">Title</label>
                    <input type="text" name="title" id="edit-title" class="form-input" required>
                </div>

                <div>
                    <label for="edit-subtitle" class="form-group-label">Subtitle (Optional)</label>
                    <input type="text" name="subtitle" id="edit-subtitle" class="form-input">
                </div>

                <div>
                    <label for="edit-image" class="form-group-label">Cover Image (Optional)</label>
                    <div id="edit-image-preview" style="margin-bottom: 0.5rem; display: none;">
                        <img id="edit-image-img" src="" alt="Current Image"
                            style="max-width: 200px; border-radius: 8px; border: 1px solid var(--glass-border);">
                    </div>
                    <input type="file" name="image" id="edit-image" class="form-input" accept="image/*">
                    <small class="form-help-text">Leave blank to keep current image</small>
                </div>

                <div>
                    <label for="edit-content" class="form-group-label">Content</label>
                    <textarea name="content" id="edit-content" class="form-textarea" required rows="8"></textarea>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label for="edit-status" class="form-group-label">Status</label>
                        <select name="status" id="edit-status" class="form-input">
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </div>
                    <div>
                        <label for="edit-published_at" class="form-group-label">Published At</label>
                        <input type="datetime-local" name="published_at" id="edit-published_at" class="form-input">
                    </div>
                </div>

                <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                    <button type="button" class="btn-secondary close-modal">Cancel</button>
                    <button type="submit" class="btn">Update Post</button>
                </div>
            </form>
        </div>
    </div>

    <div id="confirmation-modal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Konfirmasi Hapus</h2>
            </div>
            <p>Apakah Anda yakin ingin menghapus blog ini?</p>
            <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                <button id="cancel-delete" class="btn-secondary">Batal</button>
                <form id="delete-form-confirm" method="POST">
                    <input type="hidden" name="_token" value="${escapeAttribute(csrfToken)}">
                    <input type="hidden" name="_method" value="DELETE">
                    <button type="submit" class="btn-delete">Ya, Hapus</button>
                </form>
            </div>
        </div>
    </div>`,
  );
}

export function renderErrorPage(title: string, message: string, status: number): string {
  return htmlDocument(
    title,
    `<div class="container">
        <section class="auth-wrapper">
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(message)}</p>
            <p>Status: ${status}</p>
        </section>
    </div>`,
  );
}

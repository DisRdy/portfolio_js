import type { Blog, BlogContentBlock, Comment, DashboardSummary, FlashData, Project, User } from "../types";
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
import { renderProjectModal, type ProjectPreviewMetric } from "./projectModal";

const SITE_FOOTER_TEXT = "Built by Dr &copy; 2025 &mdash; All rights reserved.";
const WHATSAPP_URL = "https://wa.me/qr/OY2Y7E536RXBA1";

function renderPdfIcon(className: string): string {
  return `<span class="${escapeAttribute(`${className} project-pdf-icon`)}" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
            <path d="M7 2.75h7.2l5.05 5.05v13.45H7z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M14.2 2.75V7.8h5.05" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <rect x="3.75" y="10.25" width="12.25" height="6.5" rx="1.25" fill="currentColor"/>
            <text x="5.1" y="14.75" fill="#ffffff" font-family="Arial, sans-serif" font-size="4.25" font-weight="900">PDF</text>
        </svg>
    </span>`;
}

function publicNavbar(active: "home" | "projects" | "blog" | "comments"): string {
  return `<nav class="kof-navbar">
    <div class="navbar-container">
        <div class="navbar-brand">
            <a href="/" class="brand-link">
                <span class="brand-text">Dr</span>
            </a>
        </div>

        <button class="navbar-toggle" id="navToggle" aria-label="Toggle Navigation" aria-controls="navMenu" aria-expanded="false">
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
  const createHref = active === "blogs" ? "/dashboard/blogs/create" : "/dashboard/projects";

  return `<aside class="admin-sidebar">
    <div class="admin-brand">
        <a href="/dashboard">Welcome</a>
        <span>Precision Control Dashboard</span>
    </div>

    <nav class="admin-nav" aria-label="Dashboard navigation">
        <a href="/dashboard" class="admin-nav-link ${active === "dashboard" ? "active" : ""}">
            <span class="material-symbols-outlined">dashboard</span>
            <span>Overview</span>
        </a>
        <a href="/dashboard/projects" class="admin-nav-link ${active === "projects" ? "active" : ""}">
            <span class="material-symbols-outlined">folder_open</span>
            <span>Projects</span>
        </a>
        <a href="/dashboard/blogs" class="admin-nav-link ${active === "blogs" ? "active" : ""}">
            <span class="material-symbols-outlined">edit_note</span>
            <span>Writing</span>
        </a>
    </nav>

    <form method="POST" action="/logout" class="admin-logout-form">
        <input type="hidden" name="_token" value="${escapeAttribute(csrfToken)}">
        <button type="submit" class="admin-nav-link admin-logout-link">
            <span class="material-symbols-outlined">logout</span>
            <span>Logout</span>
        </button>
    </form>
</aside>

<header class="admin-topbar"></header>`;}

function footer(text = SITE_FOOTER_TEXT, className = ""): string {
  const classAttribute = className ? ` class="${escapeAttribute(className)}"` : "";
  return `<footer${classAttribute}>
        <p>${text}</p>
    </footer>`;
}

function publicLayout(title: string, active: "home" | "projects" | "blog" | "comments", body: string, footerText = SITE_FOOTER_TEXT): string {
  return htmlDocument(title, `${publicNavbar(active)}${body}${footer(footerText)}`);
}

function oldValue(old: Record<string, string> | undefined, key: string): string {
  return old?.[key] ?? "";
}

function selectedValue(old: Record<string, string> | undefined, key: string, value: string): string {
  return oldValue(old, key) === value ? "selected" : "";
}

function blogBlocksJson(blocks: BlogContentBlock[]): string {
  return JSON.stringify(blocks.length > 0 ? blocks : [{ type: "paragraph", value: "" }]);
}

function blogTagsInput(tags: string[]): string {
  return tags.join(", ");
}

function blogCategoryLabel(blog: Blog): string {
  return blog.category?.trim() || "System Architecture";
}

function renderBlogBlock(block: BlogContentBlock): string {
  const value = escapeHtml(block.value).replaceAll("\n", "<br>");

  if (block.type === "heading") {
    return `<h2 class="article-section-title">${value}</h2>`;
  }

  if (block.type === "blockquote") {
    return `<blockquote class="article-quote">${value}</blockquote>`;
  }

  if (block.type === "code") {
    const highlightedCode = escapeHtml(block.value)
      .replace(/\b(async|await|function|const|let|var|return|if|else|for|while|try|catch|new)\b/g, `<span class="code-keyword">$1</span>`)
      .replace(/\b(true|false|null|undefined)\b/g, `<span class="code-literal">$1</span>`)
      .replace(/(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g, `<span class="code-string">$1</span>`);

    return `<figure class="article-code-block">
        ${block.language ? `<figcaption>${escapeHtml(block.language)}</figcaption>` : ""}
        <pre><code>${highlightedCode}</code></pre>
    </figure>`;
  }

  if (block.type === "image") {
    return `<figure class="article-inline-image">
        <img src="${escapeAttribute(storageUrl(block.value))}" alt="${escapeAttribute(block.caption || "Article image")}">
        ${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ""}
    </figure>`;
  }

  return `<p>${value}</p>`;
}

function renderBlogContent(blog: Blog): string {
  const blocks = blog.contentBlocks.length > 0 ? blog.contentBlocks : [{ type: "paragraph", value: blog.content }] as BlogContentBlock[];
  return blocks.map(renderBlogBlock).join("");
}

function renderTagChips(tags: string[]): string {
  const resolvedTags = tags.length > 0 ? tags : ["Architecture", "Design Philosophy", "Systems"];
  return resolvedTags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
}

const PROJECT_CATEGORY_OPTIONS = [
  ["website", "Website"],
  ["data-analytics", "Data & Analytics"],
] as const;

function projectCategoryLabel(category: string | null | undefined): string {
  const found = PROJECT_CATEGORY_OPTIONS.find(([value]) => value === category);
  return found?.[1] ?? "Website";
}

export function renderHomePage(projects: Project[], blogs: Blog[]): string {
  const experiences = [
    ["IT Support & Web Development", "Independent Projects", "2024 - Now"],
    ["Data Analyst Student", "INSTIKI - Informatika", "2023 - Now"],
    ["Operations Driver", "FinExpress", "2021 - 2024"],
  ];

  const projectCards = projects.length > 0 ? projects.slice(0, 3).map((project) => `<a href="/project/${project.id}" class="home-mini-card">
        <span class="home-card-external material-symbols-outlined">open_in_new</span>
        <span class="home-project-icon material-symbols-outlined">rocket_launch</span>
        <strong>${escapeHtml(project.title)}</strong>
        <em>${escapeHtml(project.originalFilename)} &middot; ${escapeHtml(formatKilobytes(project.fileSize))} KB</em>
    </a>`).join("") : `<p class="home-empty">Belum ada project terbaru.</p>`;

  const blogCards = blogs.length > 0 ? blogs.slice(0, 3).map((blog) => `<a href="/blog/${encodeURIComponent(blog.slug)}" class="home-mini-card home-blog-card">
        <span class="home-card-external material-symbols-outlined">open_in_new</span>
        <span class="home-chip">${escapeHtml(blogCategoryLabel(blog))}</span>
        <strong>${escapeHtml(blog.title)}</strong>
        <p>${escapeHtml(blog.excerpt || blog.subtitle || truncate(blog.content, 120))}</p>
        <small>${escapeHtml(formatDateBlog(blog.publishedAt))}</small>
    </a>`).join("") : `<p class="home-empty">Belum ada artikel terbaru.</p>`;

  return htmlDocument(
    "Disna Radita",
    `${publicNavbar("home")}

    <main class="home-shell">
        <section class="home-hero">
            <h1>Disna Radita</h1>
            <p>Mahasiswa Informatika di INSTIKI (Institut Bisnis Dan Teknologi Indonesia) dengan fokus pada Data Analyst.</p>
            <div class="home-cta">
                <a href="${escapeAttribute(WHATSAPP_URL)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
                <a href="#contact">Contact</a>
                <a href="/">Download CV</a>
            </div>
        </section>

        <section class="home-card">
            <div class="home-section-header">
                <div>
                    <span class="material-symbols-outlined">fingerprint</span>
                    <h2>About</h2>
                </div>
            </div>
            <p class="home-body-text">Saya adalah mahasiswa Informatika yang senang membangun produk web yang rapi, memahami data, dan merapikan masalah menjadi alur kerja yang bisa dipakai. Di antara kode, analisis, dan eksplorasi sistem, saya mencari cara agar teknologi terasa sederhana, jelas, dan berguna.</p>
            <div class="home-info-grid">
                <span><span class="material-symbols-outlined">location_on</span>Bali, Indonesia</span>
                <span><span class="material-symbols-outlined">school</span>Teknik Informatika - Manajemen Data dan Informasi</span>
            </div>
        </section>

        <section class="home-card">
            <div class="home-section-header">
                <div>
                    <span class="material-symbols-outlined">work</span>
                    <h2>Experience</h2>
                </div>
            </div>
            <div class="home-list">
                ${experiences.map(([role, org, date]) => `<div class="home-list-item">
                    <div>
                        <strong>${role}</strong>
                        <small>${org}</small>
                    </div>
                    <time>${date}</time>
                </div>`).join("")}
            </div>
        </section>

        <section class="home-card">
            <div class="home-section-header">
                <div>
                    <span class="material-symbols-outlined">rocket_launch</span>
                    <h2>Projects</h2>
                </div>
                <a href="/projects">View all &gt;</a>
            </div>
            <div class="home-mini-grid">${projectCards}</div>
        </section>

        <section class="home-card">
            <div class="home-section-header">
                <div>
                    <span class="material-symbols-outlined">article</span>
                    <h2>Blog</h2>
                </div>
                <a href="/blog">View all &gt;</a>
            </div>
            <div class="home-mini-grid">${blogCards}</div>
        </section>

        <section class="home-card" id="contact">
            <div class="home-section-header">
                <div>
                    <span class="material-symbols-outlined">mail</span>
                    <h2>Contact</h2>
                </div>
            </div>
            <div class="home-contact-row">
                <p class="home-body-text">Tertarik berkolaborasi atau sekadar ingin menyapa? Jangan ragu untuk menghubungi saya.</p>
                <div class="home-contact-icons" aria-label="Contact links">
                    <a href="mailto:disnaraditya@gmail.com" aria-label="Email Disna Radita"><span class="material-symbols-outlined">mail</span></a>
                    <a href="https://github.com/DisRdy" target="_blank" rel="noopener noreferrer" aria-label="GitHub Disna Radita">
                        <svg class="github-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path d="M12 .3C5.37.3 0 5.67 0 12.3c0 5.3 3.44 9.8 8.2 11.38.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.85 1.24 1.85 1.24 1.07 1.84 2.82 1.31 3.51 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12.02 12.02 0 0 0 24 12.3C24 5.67 18.63.3 12 .3Z"/>
                        </svg>
                    </a>
                    <a href="${escapeAttribute(WHATSAPP_URL)}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Disna Radita">
                        <svg class="whatsapp-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
                            <path d="M16.01 3.2c-7.02 0-12.73 5.65-12.73 12.6 0 2.23.6 4.41 1.73 6.32L3.2 28.8l6.86-1.78a12.86 12.86 0 0 0 5.95 1.5c7.02 0 12.73-5.65 12.73-12.61S23.03 3.2 16.01 3.2Zm0 23.2c-1.86 0-3.68-.49-5.28-1.42l-.38-.22-4.07 1.06 1.09-3.93-.25-.4a10.36 10.36 0 0 1-1.63-5.58c0-5.78 4.72-10.48 10.52-10.48 5.81 0 10.53 4.7 10.53 10.48 0 5.79-4.72 10.49-10.53 10.49Zm5.77-7.85c-.31-.16-1.86-.91-2.15-1.02-.29-.11-.5-.16-.71.16-.21.31-.82 1.01-1.01 1.22-.18.21-.37.24-.68.08-.31-.16-1.32-.48-2.51-1.54-.93-.82-1.56-1.84-1.74-2.15-.18-.31-.02-.48.14-.64.14-.14.31-.37.47-.55.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.16-.71-1.69-.97-2.31-.26-.61-.52-.52-.71-.53h-.61c-.21 0-.55.08-.84.39-.29.31-1.1 1.07-1.1 2.61 0 1.54 1.13 3.03 1.29 3.24.16.21 2.22 3.36 5.38 4.72.75.32 1.34.51 1.8.65.76.24 1.45.21 2 .13.61-.09 1.86-.76 2.12-1.49.26-.73.26-1.36.18-1.49-.08-.13-.29-.21-.6-.37Z"/>
                        </svg>
                    </a>
                    <a href="https://www.instagram.com/dsnardy?igsh=bDNubXduNmNsYTM1" target="_blank" rel="noopener noreferrer" aria-label="Instagram Disna Radita"><span class="material-symbols-outlined">photo_camera</span></a>
                </div>
            </div>
        </section>
    </main>

    ${footer()}`,
    "portfolio-home",
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
  return htmlDocument(
    "Comments",
    `${publicNavbar("comments")}

    ${renderToast(flash)}

    <main class="comments-shell">
        <header class="comments-hero">
            <h1>Comments & suggestions.</h1>
            <p>Tinggalkan pesan singkat, ide, atau sapaan. Semua komentar akan tampil sebagai bagian dari ruang kecil portfolio ini.</p>
        </header>

        <section class="comments-panel" id="comments">
            <div class="comments-panel-header">
                <div>
                    <span class="material-symbols-outlined">forum</span>
                    <h2>Conversation</h2>
                </div>
                <strong>${comments.length} message${comments.length === 1 ? "" : "s"}</strong>
            </div>

            <div class="comments-layout">
                <section class="comment-form-section">
                    <h3>Tulis Komentar</h3>
                    <p>Nama dan pesanmu akan disimpan sebagai komentar public.</p>

                    <form method="POST" action="/comments" class="comment-form">
                            <input type="hidden" name="_token" value="${escapeAttribute(csrfToken)}">
                            <div>
                                <label for="name">Name</label>
                                <input type="text" id="name" name="name" required maxlength="255"
                                    placeholder="Masukkan nama Anda">
                                ${renderValidationError(errors, "name", "comment-error")}
                            </div>

                            <div>
                                <label for="comment">Komentar Anda</label>
                                <textarea id="comment" name="comment" required maxlength="1000" rows="5"
                                    placeholder="Bagikan pemikiran, saran, atau pertanyaan Anda..."></textarea>
                                <small>Maksimal 1000 karakter</small>
                                ${renderValidationError(errors, "comment", "comment-error")}
                            </div>

                            <button type="submit">
                                <span>Kirim Komentar</span>
                                <span class="material-symbols-outlined">arrow_forward</span>
                            </button>
                    </form>
                </section>

                <section class="comment-list-section">
                    <h3>Daftar Komentar</h3>

                    ${comments.length > 0 ? `<div class="comment-list">
                        ${comments.map((comment) => `<article class="comment-item">
                                <div class="comment-meta">
                                    <div>
                                        <h4>${escapeHtml(comment.name)}</h4>
                                        <time datetime="${escapeAttribute(comment.createdAt ?? "")}">
                                            ${escapeHtml(formatDateLongTime(comment.createdAt))}
                                        </time>
                                    </div>
                                    ${currentUser && currentUser.id === comment.userId ? `<span class="comment-author-badge">Anda</span>` : ""}
                                </div>
                                <p>${escapeHtml(comment.comment)}</p>
                            </article>`).join("")}
                    </div>` : `<div class="comments-empty">
                        <p>Belum ada komentar. Jadilah yang pertama memberikan komentar!</p>
                    </div>`}
                </section>
            </div>
        </section>
    </main>

    ${footer()}`,
    "comments-page",
  );
}

export function renderLoginPage(flash: FlashData, csrfToken: string): string {
  const errors = flash.errors;
  const old = flash.old;
  return htmlDocument(
    "Login",
    `<div class="login-bg" aria-hidden="true">
        <div class="login-glow login-glow-a"></div>
        <div class="login-glow login-glow-b"></div>
    </div>

    <main class="login-shell">
        <header class="login-brand">
            <div>
                <h1>DR</h1>
                <p>Precision Control Portal</p>
            </div>
        </header>

        <section class="login-panel">
            ${flash.error ? `<div class="login-alert">${escapeHtml(flash.error)}</div>` : ""}

            <form method="POST" action="/login" class="login-form">
                <input type="hidden" name="_token" value="${escapeAttribute(csrfToken)}">

                <div class="login-field">
                    <label for="email">Work Email</label>
                    <input type="email" name="email" id="email" value="${escapeAttribute(oldValue(old, "email"))}" required autofocus
                        placeholder="exsample@ex.com">
                    ${renderValidationError(errors, "email", "login-error")}
                </div>

                <div class="login-field">
                    <div class="login-label-row">
                        <label for="password">Access Token</label>
                        <span>Secure</span>
                    </div>
                    <div class="login-password-control">
                        <input type="password" name="password" id="password" required placeholder="Stt....">
                        <button type="button" class="login-password-toggle" data-password-toggle aria-controls="password" aria-label="Show password" aria-pressed="false" title="Show password">
                            <span class="material-symbols-outlined" aria-hidden="true">visibility</span>
                        </button>
                    </div>
                    ${renderValidationError(errors, "password", "login-error")}
                </div>

                <button type="submit" class="login-submit">
                    <span>Sign In</span>
                    <span class="material-symbols-outlined">arrow_forward</span>
                </button>
            </form>
        </section>

        ${footer(SITE_FOOTER_TEXT, "login-footer")}
    </main>

    <aside class="login-rail" aria-hidden="true">
        <span></span>
        <p>Authentication Layer</p>
        <span></span>
    </aside>`,
    "login-page",
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
    </div>

    ${footer()}`,
  );
}

function publicProjectCard(project: Project): string {
  return `<article class="project-card">
        <span class="project-card-external material-symbols-outlined">open_in_new</span>
        ${renderPdfIcon("project-icon")}
        <strong>${escapeHtml(project.title)}</strong>
        <small>${escapeHtml(projectCategoryLabel(project.category))}</small>
        ${project.description ? `<p>${escapeHtml(truncate(project.description, 150))}</p>` : `<p>Project PDF siap dibuka langsung dari portfolio collection.</p>`}
        <span class="project-file">
            <span>${escapeHtml(project.originalFilename)}</span>
            <em>${escapeHtml(formatKilobytes(project.fileSize))} KB</em>
        </span>
        <a href="/project/${project.id}" class="project-view-button">View Project</a>
        <time>${escapeHtml(formatDateLong(project.createdAt))}</time>
    </article>`;
}

export function renderProjectsPage(selectedCategory: string | null): string {
  return htmlDocument(
    "Projects",
    `${publicNavbar("projects")}

    <main class="projects-shell">
        <header class="projects-hero">
            <h1>Projects</h1>
            <p>Kumpulan pekerjaan terpilih, dibagi menjadi website dan data analytics agar lebih mudah dipindai.</p>
        </header>

        <section class="projects-panel">
            <div class="projects-toolbar">
                <div>
                    <span class="material-symbols-outlined">rocket_launch</span>
                    <strong>Project Index</strong>
                </div>
                <nav class="category-nav" aria-label="Project category filter">
                    <a href="/projects" class="${selectedCategory ? "" : "active"}">All</a>
                    ${PROJECT_CATEGORY_OPTIONS.map(([key, label]) => `<a href="/projects?category=${key}" class="${selectedCategory === key ? "active" : ""}">${escapeHtml(label)}</a>`).join("")}
                </nav>
            </div>

            <div class="projects-content" data-project-list data-selected-category="${escapeAttribute(selectedCategory ?? "")}">
                <div class="projects-loading">
                    <span class="material-symbols-outlined">hourglass_empty</span>
                    <p>Loading projects...</p>
                </div>
            </div>
        </section>
    </main>

    ${footer()}`,
    "projects-page",
  );
}

export function renderProjectViewerPage(project: Project): string {
  const metrics: ProjectPreviewMetric[] = [
    { label: "Category", value: projectCategoryLabel(project.category) },
    { label: "Size", value: `${formatKilobytes(project.fileSize)} KB` },
    { label: "Uploaded", value: formatDateShort(project.createdAt) },
  ];

  return htmlDocument(
    `${project.title} - Project`,
    `${publicNavbar("projects")}

    <main class="projects-shell project-viewer-shell">
        <header class="project-viewer-header">
            <a href="/projects" class="project-back-link">&lt; Back to projects</a>
            <div class="project-kicker">
                <span>${escapeHtml(projectCategoryLabel(project.category))}</span>
                <time datetime="${escapeAttribute(project.createdAt ?? "")}">${escapeHtml(formatDateBlog(project.createdAt))}</time>
            </div>
            <h1>${escapeHtml(project.title)}</h1>
            ${project.description ? `<p>${escapeHtml(project.description)}</p>` : ""}
        </header>

        ${renderProjectModal({
      fileUrl: `/project/${project.id}/file`,
      fileName: project.originalFilename,
      fileSize: formatKilobytes(project.fileSize),
      title: project.title,
      description: project.description,
      category: projectCategoryLabel(project.category),
      metrics,
      totalPages: 1,
    })}
    </main>

    ${footer()}`,
    "projects-page",
  );
}

export function renderDashboardPage(summary: DashboardSummary, csrfToken: string, flash: FlashData): string {
  const totalRecords = summary.projectCount + summary.blogCount;
  const recentRecords = [
    ...summary.recentProjects.map((project) => ({
      category: projectCategoryLabel(project.category),
      href: "/dashboard/projects",
      icon: "folder_open",
      metric: `${formatKilobytes(project.fileSize)} KB`,
      meta: `${project.originalFilename} / ${formatDateShort(project.createdAt)}`,
      status: "Project",
      statusClass: "badge-project",
      title: project.title,
    })),
    ...summary.recentBlogs.map((blog) => ({
      category: "Writing",
      href: "/dashboard/blogs",
      icon: "edit_note",
      metric: blog.publishedAt ? formatDateShort(blog.publishedAt) : "Not published",
      meta: blog.subtitle || "Blog post",
      status: blog.status.charAt(0).toUpperCase() + blog.status.slice(1),
      statusClass: blog.status === "published" ? "badge-success" : "badge-warning",
      title: blog.title,
    })),
  ].slice(0, 6);

  return htmlDocument(
    "Dashboard",
    `${dashboardNavbar("dashboard", csrfToken)}
    ${renderToast(flash)}

    <div class="dashboard-wrapper">
        <div class="admin-container">
            <div class="dashboard-header">
                <div>
                    <h1>System Overview</h1>
                    <p>Real-time overview from your current portfolio records.</p>
                </div>
            </div>

            <div class="summary-grid">
                <div class="summary-card summary-card-wide">
                    <div class="summary-info">
                        <span class="summary-label">Total Records</span>
                        <span class="summary-count">${totalRecords}</span>
                        <span class="summary-note positive">Portfolio entries across projects and writing</span>
                    </div>
                    <span class="material-symbols-outlined summary-watermark">insights</span>
                </div>

                <a href="/dashboard/blogs" class="summary-card">
                    <div class="summary-info">
                        <span class="summary-label">Published</span>
                        <span class="summary-count">${summary.publishedBlogCount}</span>
                        <span class="summary-note">Live articles</span>
                    </div>
                </a>

                <a href="/dashboard/projects" class="summary-card">
                    <div class="summary-info">
                        <span class="summary-label">Active Projects</span>
                        <span class="summary-count">${summary.projectCount}</span>
                        <span class="summary-progress"><span></span></span>
                    </div>
                </a>

                <div class="summary-card">
                    <div class="summary-info">
                        <span class="summary-label">Writing Frequency</span>
                        <span class="summary-count">${summary.blogCount.toString().padStart(2, "0")}</span>
                        <span class="summary-note">${summary.draftBlogCount} draft${summary.draftBlogCount === 1 ? "" : "s"} in progress</span>
                    </div>
                </div>
            </div>

            <section class="records-section">
                <div class="records-toolbar">
                    <div class="records-tabs">
                        <a href="/dashboard" class="active">All Records</a>
                    </div>
                    <div class="records-sort">
                        <span>Sort by</span>
                        <strong>Latest Activity</strong>
                        <span class="material-symbols-outlined">expand_more</span>
                    </div>
                </div>

                <div class="records-panel">
                    ${recentRecords.length === 0 ? `<div class="empty-state">
                        <p>No records yet. Start by adding a project or blog post.</p>
                    </div>` : `<table class="records-table">
                        <thead>
                            <tr>
                                <th>Record Title</th>
                                <th>Status</th>
                                <th>Category</th>
                                <th>Metrics</th>
                                <th>Control</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${recentRecords.map((record) => `<tr>
                                <td>
                                    <div class="record-title-cell">
                                        <span class="record-thumb">
                                            <span class="material-symbols-outlined">${record.icon}</span>
                                        </span>
                                        <div>
                                            <strong>${escapeHtml(record.title)}</strong>
                                            <small>${escapeHtml(record.meta)}</small>
                                        </div>
                                    </div>
                                </td>
                                <td><span class="badge ${record.statusClass}">${escapeHtml(record.status)}</span></td>
                                <td>${escapeHtml(record.category)}</td>
                                <td>${escapeHtml(record.metric)}</td>
                                <td><a href="${record.href}" class="table-action" aria-label="Open record management"><span class="material-symbols-outlined">arrow_forward</span></a></td>
                            </tr>`).join("")}
                        </tbody>
                    </table>
                    <div class="records-footer">
                        <span>Showing ${recentRecords.length} of ${totalRecords} entries</span>
                        <div>
                            <a href="/dashboard/projects">Projects</a>
                            <a href="/dashboard/blogs">Writing</a>
                        </div>
                    </div>`}
                </div>
            </section>
        </div>
    </div>

    ${footer()}`,
    "admin-page",
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
                    <button type="button" class="btn" id="open-create-project-modal">
                        + New Project
                    </button>
                </div>
                <hr class="divider">
            </div>

            ${projects.length === 0 ? `<div class="empty-state"><p>Anda belum memiliki project. Upload project pertama Anda!</p></div>` : PROJECT_CATEGORY_OPTIONS.map(([key, label]) => {
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

        </div>
    </div>

    <div id="create-project-modal" class="modal-overlay" hidden>
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
                        ${PROJECT_CATEGORY_OPTIONS.map(([key, label]) => `<option value="${key}" ${selectedValue(old, "category", key)}>${escapeHtml(label)}</option>`).join("")}
                    </select>
                    ${renderValidationError(errors, "category")}
                </div>

                <div>
                    <label class="form-group-label">PDF File (Max 10MB)</label>
                    <input type="file" name="file" class="form-input" accept="application/pdf,.pdf" required>
                    ${renderValidationError(errors, "file")}
                </div>

                <div>
                    <button type="button" class="btn-secondary close-modal">Batal</button>
                    <button type="submit" class="btn">Upload Project</button>
                </div>
            </form>
        </div>
    </div>

    <div id="edit-project-modal" class="modal-overlay" hidden>
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
                        ${PROJECT_CATEGORY_OPTIONS.map(([key, label]) => `<option value="${key}">${escapeHtml(label)}</option>`).join("")}
                    </select>
                </div>

                <div>
                    <label class="form-group-label">File Saat Ini</label>
                    <p id="edit-project-current-file"></p>
                </div>

                <div>
                    <label class="form-group-label">Ganti PDF (Opsional)</label>
                    <input type="file" name="file" class="form-input" accept="application/pdf,.pdf">
                    <small class="form-help-text">Kosongkan jika tidak ingin mengganti file</small>
                </div>

                <div>
                    <button type="button" class="btn-secondary close-modal">Batal</button>
                    <button type="submit" class="btn">Simpan</button>
                </div>
            </form>
        </div>
    </div>

    <div id="confirmation-modal" class="modal-overlay" hidden>
        <div class="modal-content">
            <div class="modal-header">
                <h2>Konfirmasi Hapus</h2>
            </div>
            <p>Apakah Anda yakin ingin menghapus project ini?</p>
            <div>
                <button id="cancel-delete" class="btn-secondary">Batal</button>
                <form id="delete-form-confirm" method="POST">
                    <input type="hidden" name="_token" value="${escapeAttribute(csrfToken)}">
                    <input type="hidden" name="_method" value="DELETE">
                    <button type="submit" class="btn-delete">Ya, Hapus</button>
                </form>
            </div>
        </div>
    </div>

    ${footer()}`,
    "admin-page",
  );
}

export function renderBlogIndexPage(blogs: Blog[]): string {
  const blogCards = blogs.length > 0 ? blogs.map((blog) => `<a href="/blog/${encodeURIComponent(blog.slug)}" class="blog-index-card">
        <span class="blog-card-external material-symbols-outlined">open_in_new</span>
        <span class="blog-chip">${escapeHtml(blogCategoryLabel(blog))}</span>
        <h2>${escapeHtml(blog.title)}</h2>
        <p>${escapeHtml(blog.excerpt || blog.subtitle || truncate(blog.content, 140))}</p>
        <time datetime="${escapeAttribute(blog.publishedAt ?? "")}">${escapeHtml(formatDateBlog(blog.publishedAt))}</time>
    </a>`).join("") : `<div class="blog-index-empty">
        <p>No posts published yet. Check back later!</p>
    </div>`;

  return htmlDocument(
    "Blog - Dr",
    `${publicNavbar("blog")}

    <main class="blog-shell blog-index-shell">
        <header class="blog-index-hero">
            <h1>Blog</h1>
            <p>Catatan tentang sistem, data, proses belajar, dan hal-hal teknis yang sedang saya rapikan.</p>
        </header>

        <section class="blog-index-panel">
            <div class="blog-index-panel-header">
                <div>
                    <span class="material-symbols-outlined">article</span>
                    <strong>Blog Index</strong>
                </div>
                <em>${blogs.length} article${blogs.length === 1 ? "" : "s"}</em>
            </div>

            <div class="blog-index-grid">${blogCards}</div>
        </section>
    </main>

    ${footer()}`,
    "blog-page",
  );
}

export function renderBlogShowPage(blog: Blog): string {
  const shareText = blog.excerpt || blog.subtitle || truncate(blog.content, 180);

  return htmlDocument(
    `${blog.title} - Dr`,
    `${publicNavbar("blog")}

    <main class="blog-shell">
        <article class="blog-article">
            <a href="/blog" class="article-back-link">&lt; Back to writing</a>

            <header class="blog-header">
                <div class="article-kicker">
                    <span>${escapeHtml(blogCategoryLabel(blog))}</span>
                    <time datetime="${escapeAttribute(blog.publishedAt ?? "")}">${escapeHtml(formatDateBlog(blog.publishedAt))}</time>
                </div>
                <h1 class="article-title">${escapeHtml(blog.title)}</h1>
                ${blog.subtitle ? `<p class="article-subtitle">${escapeHtml(blog.subtitle)}</p>` : ""}
            </header>

            ${blog.image ? `<figure class="article-hero-image">
                <img src="${escapeAttribute(storageUrl(blog.image))}" alt="${escapeAttribute(blog.title)}">
                ${blog.imageCaption ? `<figcaption>${escapeHtml(blog.imageCaption)}</figcaption>` : ""}
            </figure>` : ""}

            <div class="article-content">${renderBlogContent(blog)}</div>

            <div class="article-footer">
                <div class="article-tags">${renderTagChips(blog.tags)}</div>
                <div class="article-actions">
                    <button type="button" aria-label="Share article" data-share-article
                        data-share-title="${escapeAttribute(blog.title)}"
                        data-share-text="${escapeAttribute(shareText)}">
                        <span class="material-symbols-outlined">share</span>
                    </button>
                </div>
            </div>
        </article>
    </main>

    ${footer()}`,
    "blog-page",
  );
}

export function renderDashboardBlogsPage(options: {
  blogs: Blog[];
  flash: FlashData;
  csrfToken: string;
}): string {
  const { blogs, flash, csrfToken } = options;

  return htmlDocument(
    "Manage Blogs - Dashboard",
    `${dashboardNavbar("blogs", csrfToken)}
    ${renderToast(flash)}

    <div class="dashboard-wrapper">
        <div class="container">
            <div class="dashboard-header">
                <div class="dashboard-title">
                    <h1>Manage Blogs</h1>
                    <a href="/dashboard/blogs/create" class="btn">
                        + New Post
                    </a>
                </div>
                <hr class="divider">
            </div>

            <div class="project-list">
                ${blogs.length > 0 ? blogs.map((blog) => `<div class="project-item">
                        <div class="project-item-info">
                            <div>
                                <h5>${escapeHtml(blog.title)}</h5>
                                <span class="badge ${blog.status === "published" ? "badge-success" : "badge-warning"}">
                                    ${escapeHtml(blog.status.charAt(0).toUpperCase() + blog.status.slice(1))}
                                </span>
                            </div>
                            ${blog.subtitle ? `<p>${escapeHtml(truncate(blog.subtitle, 80))}</p>` : ""}
                            <p class="file-details">
                                <small>${escapeHtml(blogCategoryLabel(blog))} / Published: ${blog.publishedAt ? escapeHtml(formatDateShort(blog.publishedAt)) : "-"}</small>
                            </p>

                            <div class="project-item-actions">
                                <a href="/dashboard/blogs/${blog.id}/edit" class="btn-edit">
                                    Edit
                                </a>
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
        </div>
    </div>

    <div id="confirmation-modal" class="modal-overlay" hidden>
        <div class="modal-content">
            <div class="modal-header">
                <h2>Konfirmasi Hapus</h2>
            </div>
            <p>Apakah Anda yakin ingin menghapus blog ini?</p>
            <div>
                <button id="cancel-delete" class="btn-secondary">Batal</button>
                <form id="delete-form-confirm" method="POST">
                    <input type="hidden" name="_token" value="${escapeAttribute(csrfToken)}">
                    <input type="hidden" name="_method" value="DELETE">
                    <button type="submit" class="btn-delete">Ya, Hapus</button>
                </form>
            </div>
        </div>
    </div>

    ${footer()}`,
    "admin-page",
  );
}

export function renderDashboardBlogFormPage(options: {
  blog?: Blog;
  csrfToken: string;
  flash: FlashData;
  mode: "create" | "edit";
}): string {
  const { blog, csrfToken, flash, mode } = options;
  const errors = flash.errors;
  const old = baseOldValues(flash.old, ["title", "subtitle", "category", "tags", "image_caption", "content_blocks", "status", "published_at"]);
  const isEdit = mode === "edit" && blog;
  const title = isEdit ? "Edit Blog" : "Create Blog";
  const action = isEdit ? `/dashboard/blogs/${blog.id}` : "/dashboard/blogs";
  const hasOld = (key: string): boolean => Object.prototype.hasOwnProperty.call(old, key);
  const oldOr = (key: string, fallback: string): string => hasOld(key) ? oldValue(old, key) : fallback;
  const titleValue = oldOr("title", blog?.title || "");
  const subtitleValue = oldOr("subtitle", blog?.subtitle || "");
  const categoryValue = oldOr("category", blog?.category || "");
  const tagsValue = oldOr("tags", blog ? blogTagsInput(blog.tags) : "");
  const imageCaptionValue = oldOr("image_caption", blog?.imageCaption || "");
  const contentBlocksValue = oldOr("content_blocks", blog ? blogBlocksJson(blog.contentBlocks) : blogBlocksJson([{ type: "paragraph", value: "" }]));
  const statusValue = oldOr("status", blog?.status || "draft");
  const publishedAtValue = oldOr("published_at", blog?.publishedAt ? blog.publishedAt.replace(" ", "T").slice(0, 16) : "");

  return htmlDocument(
    `${title} - Dashboard`,
    `${dashboardNavbar("blogs", csrfToken)}
    ${renderToast(flash)}

    <div class="dashboard-wrapper">
        <div class="container blog-form-page">
            <div class="dashboard-header">
                <div class="dashboard-title">
                    <div>
                        <h1>${title}</h1>
                        <p>Compose the article as structured content blocks.</p>
                    </div>
                    <a href="/dashboard/blogs" class="btn-secondary">
                        &larr; Back to Blogs
                    </a>
                </div>
                <hr class="divider">
            </div>

            <form class="blog-editor-form" action="${action}" method="POST" enctype="multipart/form-data">
                <input type="hidden" name="_token" value="${escapeAttribute(csrfToken)}">
                ${isEdit ? `<input type="hidden" name="_method" value="PUT">` : ""}

                <section class="blog-form-section">
                    <h2>Article Header</h2>

                    <div>
                        <label for="blog-title" class="form-group-label">Title</label>
                        <input type="text" name="title" id="blog-title" class="form-input" value="${escapeAttribute(titleValue)}" required>
                        ${renderValidationError(errors, "title")}
                    </div>

                    <div>
                        <label for="blog-subtitle" class="form-group-label">Subtitle (Optional)</label>
                        <input type="text" name="subtitle" id="blog-subtitle" class="form-input" value="${escapeAttribute(subtitleValue)}">
                        ${renderValidationError(errors, "subtitle")}
                    </div>

                    <div class="form-grid-2">
                        <div>
                            <label for="blog-category" class="form-group-label">Category</label>
                            <input type="text" name="category" id="blog-category" class="form-input"
                                placeholder="System Architecture" value="${escapeAttribute(categoryValue)}">
                            ${renderValidationError(errors, "category")}
                        </div>
                        <div>
                            <label for="blog-tags" class="form-group-label">Tags</label>
                            <input type="text" name="tags" id="blog-tags" class="form-input"
                                placeholder="Architecture, Systems" value="${escapeAttribute(tagsValue)}">
                        </div>
                    </div>
                </section>

                <section class="blog-form-section">
                    <h2>Hero Image</h2>

                    ${isEdit && blog.image ? `<figure class="current-blog-image">
                        <img src="${escapeAttribute(storageUrl(blog.image))}" alt="${escapeAttribute(blog.title)}">
                        <figcaption>Current hero image</figcaption>
                    </figure>` : ""}

                    <div>
                        <label for="blog-image" class="form-group-label">Cover Image ${isEdit ? "(Optional)" : "(Optional)"}</label>
                        <input type="file" name="image" id="blog-image" class="form-input blog-image-file-input" accept="image/*">
                        ${isEdit ? `<small class="form-help-text">Leave blank to keep current image</small>` : ""}
                        ${renderValidationError(errors, "image")}
                    </div>

                    <div>
                        <label for="blog-image-caption" class="form-group-label">Hero Image Caption</label>
                        <input type="text" name="image_caption" id="blog-image-caption" class="form-input"
                            placeholder="Fig 1: The geometry of architectural debt." value="${escapeAttribute(imageCaptionValue)}">
                        ${renderValidationError(errors, "image_caption")}
                    </div>
                </section>

                <section class="blog-form-section">
                    <h2>Content Blocks</h2>

                    <input type="hidden" name="content_blocks" id="blog-content-blocks" value="${escapeAttribute(contentBlocksValue)}">
                    <div class="block-editor" data-block-editor data-target="blog-content-blocks">
                        <div class="block-editor-list"></div>
                        <div class="block-editor-actions">
                            <button type="button" data-add-block="paragraph">Paragraph</button>
                            <button type="button" data-add-block="heading">Heading</button>
                            <button type="button" data-add-block="blockquote">Quote</button>
                            <button type="button" data-add-block="code">Code</button>
                            <button type="button" data-add-block="image">Image</button>
                        </div>
                    </div>
                    ${renderValidationError(errors, "content_blocks")}
                </section>

                <section class="blog-form-section">
                    <h2>Publishing</h2>

                    <div class="form-grid-2">
                        <div>
                            <label for="blog-status" class="form-group-label">Status</label>
                            <select name="status" id="blog-status" class="form-input">
                                <option value="draft" ${statusValue === "draft" ? "selected" : ""}>Draft</option>
                                <option value="published" ${statusValue === "published" ? "selected" : ""}>Published</option>
                            </select>
                        </div>
                        <div>
                            <label for="blog-published-at" class="form-group-label">Published At</label>
                            <input type="datetime-local" name="published_at" id="blog-published-at" class="form-input"
                                value="${escapeAttribute(publishedAtValue)}">
                        </div>
                    </div>
                </section>

                <div class="blog-form-actions">
                    <a href="/dashboard/blogs" class="btn-secondary">Cancel</a>
                    <button type="submit" class="btn">${isEdit ? "Update Blog" : "Create Blog"}</button>
                </div>
            </form>
        </div>
    </div>

    ${footer()}`,
    "admin-page",
  );
}

export function renderNotFoundPage(): string {
  return `<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>404 - Page Not Found</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&amp;family=JetBrains+Mono:wght@400;500;700&amp;family=Press+Start+2P&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "tertiary-fixed": "#ffdea4",
                        "on-background": "#dce3f1",
                        "error-container": "#93000a",
                        "error": "#ffb4ab",
                        "on-secondary-container": "#b8b4b4",
                        "on-primary": "#00315d",
                        "on-error-container": "#ffdad6",
                        "on-tertiary": "#412d00",
                        "surface-bright": "#333a45",
                        "surface": "#0d141d",
                        "on-tertiary-fixed": "#261900",
                        "secondary-fixed": "#e6e1e1",
                        "surface-container-highest": "#2e3540",
                        "surface-tint": "#a4c9ff",
                        "surface-container": "#19202a",
                        "on-secondary": "#313030",
                        "surface-dim": "#0d141d",
                        "on-primary-container": "#003a6b",
                        "surface-variant": "#2e3540",
                        "surface-container-low": "#151c26",
                        "primary-container": "#60a5fa",
                        "inverse-primary": "#0060ac",
                        "on-primary-fixed": "#001c39",
                        "outline-variant": "#414751",
                        "primary": "#a4c9ff",
                        "on-tertiary-fixed-variant": "#5d4200",
                        "on-primary-fixed-variant": "#004883",
                        "surface-container-high": "#232a35",
                        "secondary-fixed-dim": "#c9c6c5",
                        "surface-container-lowest": "#070f18",
                        "tertiary": "#fabd34",
                        "secondary": "#c9c6c5",
                        "inverse-on-surface": "#2a313b",
                        "primary-fixed": "#d4e3ff",
                        "secondary-container": "#484646",
                        "inverse-surface": "#dce3f1",
                        "on-secondary-fixed-variant": "#484646",
                        "background": "#0d141d",
                        "primary-fixed-dim": "#a4c9ff",
                        "outline": "#8b919d",
                        "on-surface-variant": "#c1c7d3",
                        "on-error": "#690005",
                        "tertiary-container": "#d19900",
                        "on-secondary-fixed": "#1c1b1b",
                        "tertiary-fixed-dim": "#fabd34",
                        "on-tertiary-container": "#4b3500",
                        "on-surface": "#dce3f1"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "stack-sm": "8px",
                        "gutter": "24px",
                        "container-max": "1100px",
                        "stack-lg": "48px",
                        "margin-mobile": "16px",
                        "base": "4px",
                        "stack-md": "16px"
                    },
                    "fontFamily": {
                        "caption": ["Inter"],
                        "body-md": ["Inter"],
                        "headline-xl": ["Inter"],
                        "body-lg": ["Inter"],
                        "headline-lg": ["Inter"],
                        "label-mono": ["JetBrains Mono"],
                        "headline-xl-mobile": ["Inter"],
                        "headline-md": ["Inter"],
                        "arcade": ["Press Start 2P"]
                    },
                    "fontSize": {
                        "caption": ["14px", { "lineHeight": "1.4", "fontWeight": "400" }],
                        "body-md": ["16px", { "lineHeight": "1.5", "fontWeight": "400" }],
                        "headline-xl": ["48px", { "lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "800" }],
                        "body-lg": ["18px", { "lineHeight": "1.6", "fontWeight": "400" }],
                        "headline-lg": ["32px", { "lineHeight": "1.2", "letterSpacing": "-0.01em", "fontWeight": "700" }],
                        "label-mono": ["13px", { "lineHeight": "1", "letterSpacing": "0.05em", "fontWeight": "500" }],
                        "headline-xl-mobile": ["32px", { "lineHeight": "1.2", "letterSpacing": "-0.01em", "fontWeight": "800" }],
                        "headline-md": ["24px", { "lineHeight": "1.3", "fontWeight": "600" }]
                    }
                }
            }
        }
    </script>
<style>
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: #131313;
        }
        
        .game-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 100vw;
            height: 100vh;
            position: relative;
        }

        .pong-court {
            width: calc(100vw - 24px);
            height: calc(100vh - 24px);
            margin: 12px;
            border: 2px solid #60a5fa;
            border-radius: 12px;
            box-shadow: 0 0 32px rgba(96, 165, 250, 0.3);
            position: relative;
            background-color: #0a0a0a;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .center-line {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            background-image: linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 50%, transparent 50%);
            background-size: 100% 20px;
            z-index: 1;
        }

        .paddle {
            width: 12px;
            height: 80px;
            background-color: #ffffff;
            position: absolute;
            z-index: 2;
            transition: top 0.1s linear, background-color 0.1s;
        }
        
        .paddle.hit {
            background-color: rgba(96, 165, 250, 0.8);
            box-shadow: 0 0 16px rgba(96, 165, 250, 0.6);
        }

        #paddle-left {
            left: 24px;
            top: 50%;
            transform: translateY(-50%);
        }

        #paddle-right {
            right: 24px;
            top: 50%;
            transform: translateY(-50%);
        }

        #ball {
            width: 16px;
            height: 16px;
            background-color: #60a5fa;
            position: absolute;
            z-index: 3;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 12px rgba(96, 165, 250, 0.5);
        }

        .content-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10;
            pointer-events: none;
        }

        @keyframes glitch {
          0%   { transform: translate(0); clip-path: none; }
          2%   { transform: translate(-3px, 1px); clip-path: inset(20% 0 60% 0); color: #60a5fa; }
          4%   { transform: translate(3px, -1px); clip-path: inset(50% 0 20% 0); color: #ffffff; }
          6%   { transform: translate(-2px, 2px); clip-path: inset(80% 0 5% 0); color: #60a5fa; }
          8%   { transform: translate(0); clip-path: none; color: #ffffff; }
          100% { transform: translate(0); clip-path: none; }
        }

        @keyframes glitch-2 {
          0%   { transform: translate(0); opacity: 1; }
          3%   { transform: translate(4px, 0); opacity: 0.8; color: rgba(96,165,250,0.7); }
          5%   { transform: translate(-4px, 0); opacity: 1; color: #ffffff; }
          7%   { transform: translate(0); }
          100% { transform: translate(0); }
        }

        .error-code {
            font-family: 'Press Start 2P', monospace;
            font-size: clamp(40px, 8vw, 80px);
            color: #ffffff;
            text-shadow: 0 4px 24px rgba(0, 0, 0, 0.8);
            margin-bottom: 24px;
            letter-spacing: 4px;
            animation: glitch 4s infinite, glitch-2 4s infinite 0.5s;
            position: relative;
        }

        .error-message {
            font-family: 'Press Start 2P', monospace;
            font-size: clamp(10px, 2vw, 14px);
            color: #c6c6c6;
            text-align: center;
            line-height: 1.8;
            margin-bottom: 48px;
            text-shadow: 0 2px 12px rgba(0, 0, 0, 0.8);
            padding: 0 24px;
        }

        .btn-home {
            pointer-events: auto;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 32px;
            border-radius: 9999px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background-color: #1c1b1b;
            color: #e5e2e1;
            font-family: 'Inter', sans-serif;
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            transition: all 0.2s ease;
            text-decoration: none;
        }

        .btn-home:hover {
            background-color: rgba(96, 165, 250, 0.12);
            color: #ffffff;
        }
        
        .footer-overlay {
            position: absolute;
            bottom: 24px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: center;
            z-index: 10;
        }
    </style>
</head>
<body class="text-on-background bg-[#131313]">
<main class="game-container">
<div class="pong-court" id="court">
<div class="center-line"></div>
<div class="paddle" id="paddle-left"></div>
<div class="paddle" id="paddle-right"></div>
<div id="ball"></div>
<div class="content-overlay">
<h1 class="error-code">404</h1>
<p class="error-message">Oops! Looks Like<br/>You Are Lost</p>
<a class="btn-home" href="/">Return Home</a>
</div>
<div class="footer-overlay">
<p class="font-label-mono text-[12px] text-[#8f96a3] tracking-widest text-center opacity-70">
                Built by Dr &copy; 2025 &mdash; All rights reserved.
            </p>
</div>
</div>
</main>
<script>
        const ball = document.getElementById('ball');
        const paddleLeft = document.getElementById('paddle-left');
        const paddleRight = document.getElementById('paddle-right');
        const court = document.getElementById('court');

        // Game state
        let courtRect = court.getBoundingClientRect();
        let ballState = {
            x: courtRect.width / 2 - 8,
            y: courtRect.height / 2 - 8,
            vx: 4,
            vy: 3,
            size: 16
        };
        
        let paddleState = {
            leftY: courtRect.height / 2 - 40,
            rightY: courtRect.height / 2 - 40,
            width: 12,
            height: 80,
            speed: 3.5,
            padding: 24
        };

        // Handle resize
        window.addEventListener('resize', () => {
            courtRect = court.getBoundingClientRect();
            ballState.x = courtRect.width / 2 - 8;
            ballState.y = courtRect.height / 2 - 8;
        });

        function flashPaddle(paddleEl) {
            paddleEl.classList.add('hit');
            setTimeout(() => {
                paddleEl.classList.remove('hit');
            }, 150);
        }

        function updateGame() {
            // Move ball
            ballState.x += ballState.vx;
            ballState.y += ballState.vy;

            // Wall collisions (top/bottom)
            if (ballState.y <= 0) {
                ballState.y = 0;
                ballState.vy *= -1;
            } else if (ballState.y >= courtRect.height - ballState.size) {
                ballState.y = courtRect.height - ballState.size;
                ballState.vy *= -1;
            }

            // Paddle collisions
            // Left paddle
            if (ballState.x <= paddleState.padding + paddleState.width && 
                ballState.x + ballState.size >= paddleState.padding &&
                ballState.y + ballState.size >= paddleState.leftY && 
                ballState.y <= paddleState.leftY + paddleState.height) {
                
                ballState.x = paddleState.padding + paddleState.width;
                ballState.vx *= -1.05; // slight speed increase
                flashPaddle(paddleLeft);
            }
            
            // Right paddle
            if (ballState.x + ballState.size >= courtRect.width - paddleState.padding - paddleState.width && 
                ballState.x <= courtRect.width - paddleState.padding &&
                ballState.y + ballState.size >= paddleState.rightY && 
                ballState.y <= paddleState.rightY + paddleState.height) {
                
                ballState.x = courtRect.width - paddleState.padding - paddleState.width - ballState.size;
                ballState.vx *= -1.05;
                flashPaddle(paddleRight);
            }

            // AI Paddles (smooth tracking)
            // Left paddle follows ball if moving left
            if (ballState.vx < 0) {
                let targetY = ballState.y - paddleState.height / 2 + ballState.size / 2;
                if (paddleState.leftY < targetY) paddleState.leftY += paddleState.speed;
                if (paddleState.leftY > targetY) paddleState.leftY -= paddleState.speed;
            }
            
            // Right paddle follows ball if moving right
            if (ballState.vx > 0) {
                let targetY = ballState.y - paddleState.height / 2 + ballState.size / 2;
                if (paddleState.rightY < targetY) paddleState.rightY += paddleState.speed;
                if (paddleState.rightY > targetY) paddleState.rightY -= paddleState.speed;
            }

            // Constrain paddles
            paddleState.leftY = Math.max(0, Math.min(courtRect.height - paddleState.height, paddleState.leftY));
            paddleState.rightY = Math.max(0, Math.min(courtRect.height - paddleState.height, paddleState.rightY));

            // Reset if out of bounds (scoring)
            if (ballState.x < -50 || ballState.x > courtRect.width + 50) {
                ballState.x = courtRect.width / 2 - 8;
                ballState.y = courtRect.height / 2 - 8;
                ballState.vx = (Math.random() > 0.5 ? 4 : -4);
                ballState.vy = (Math.random() * 6) - 3;
            }

            // Apply positions
            ball.style.left = \`\${ballState.x}px\`;
            ball.style.top = \`\${ballState.y}px\`;
            paddleLeft.style.top = \`\${paddleState.leftY}px\`;
            paddleRight.style.top = \`\${paddleState.rightY}px\`;

            requestAnimationFrame(updateGame);
        }

        // Start game loop
        requestAnimationFrame(updateGame);
    </script>
</body></html>`;
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
    </div>

    ${footer()}`,
  );
}

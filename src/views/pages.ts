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
        <a href="/dashboard">Admin</a>
        <span>Precision Control</span>
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

    <div class="admin-user-card">
        <div>
            <p>Disna Radita</p>
            <span>Administrator</span>
        </div>
    </div>

    <form method="POST" action="/logout" class="admin-logout-form">
        <input type="hidden" name="_token" value="${escapeAttribute(csrfToken)}">
        <button type="submit" class="admin-nav-link admin-logout-link">
            <span class="material-symbols-outlined">logout</span>
            <span>Logout</span>
        </button>
    </form>
</aside>

<header class="admin-topbar"></header>`;}

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

  const projectCards = projects.length > 0 ? projects.slice(0, 3).map((project) => `<a href="/project/${project.id}/download" class="home-mini-card">
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
                <a href="#contact">WhatsApp</a>
                <a href="#contact">Contact</a>
                <a href="/projects">Download CV</a>
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
                <span><span class="material-symbols-outlined">school</span>INSTIKI - Informatika</span>
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
                    <a href="https://github.com/DisRdy" target="_blank" rel="noopener noreferrer" aria-label="GitHub Disna Radita"><span class="material-symbols-outlined">code</span></a>
                    <a href="https://dev.to/lamp" target="_blank" rel="noopener noreferrer" aria-label="Dev Community Disna Radita"><span class="material-symbols-outlined">laptop_mac</span></a>
                    <a href="https://www.instagram.com/dsnardy?igsh=bDNubXduNmNsYTM1" target="_blank" rel="noopener noreferrer" aria-label="Instagram Disna Radita"><span class="material-symbols-outlined">photo_camera</span></a>
                </div>
            </div>
        </section>
    </main>

    ${footer("&copy; 2025 Dr")}`,
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
            <span>Guestbook</span>
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

    ${footer("&copy; 2025 Dr")}`,
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
                    <input type="password" name="password" id="password" required placeholder="Stt....">
                    ${renderValidationError(errors, "password", "login-error")}
                </div>

                <button type="submit" class="login-submit">
                    <span>Sign In</span>
                    <span class="material-symbols-outlined">arrow_forward</span>
                </button>
            </form>
        </section>

        <footer class="login-footer">
            <p>&copy; 2025 DR. Precision Engineered.</p>
        </footer>
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
    </div>`,
  );
}

function publicProjectCard(project: Project): string {
  return `<a href="/project/${project.id}/download" class="project-card">
        <span class="project-card-external material-symbols-outlined">open_in_new</span>
        <span class="project-icon material-symbols-outlined">folder_open</span>
        <strong>${escapeHtml(project.title)}</strong>
        <small>${escapeHtml(projectCategoryLabel(project.category))}</small>
        ${project.description ? `<p>${escapeHtml(truncate(project.description, 150))}</p>` : `<p>Project file siap diunduh dari portfolio collection.</p>`}
        <span class="project-file">
            <span>${escapeHtml(project.originalFilename)}</span>
            <em>${escapeHtml(formatKilobytes(project.fileSize))} KB</em>
        </span>
        <time>${escapeHtml(formatDateLong(project.createdAt))}</time>
    </a>`;
}

export function renderProjectsPage(projects: Project[], selectedCategory: string | null): string {
  const groupedProjects = new Map<string, Project[]>();
  for (const project of projects) {
    const list = groupedProjects.get(project.category) ?? [];
    list.push(project);
    groupedProjects.set(project.category, list);
  }

  let content = "";
  if (projects.length === 0) {
    content = `<div class="projects-empty">
                    <p>${selectedCategory
      ? `Belum ada proyek dalam kategori <strong>${escapeHtml(projectCategoryLabel(selectedCategory))}</strong>.`
      : "Belum ada proyek yang diupload."}</p>
                </div>`;
  } else if (selectedCategory) {
    content = `<section class="project-category-section">
                        <div class="project-category-heading">
                            <h2>${escapeHtml(projectCategoryLabel(selectedCategory))}</h2>
                            <span>${projects.length} project</span>
                        </div>
                        <div class="projects-grid">
                            ${projects.map(publicProjectCard).join("")}
                        </div>
                    </section>`;
  } else {
    content = PROJECT_CATEGORY_OPTIONS.map(([key, label]) => {
      const group = groupedProjects.get(key);
      if (!group?.length) {
        return "";
      }

      return `<section class="project-category-section">
                <div class="project-category-heading">
                    <h2>${escapeHtml(label)}</h2>
                    <span>${group.length} project</span>
                </div>
                <div class="projects-grid">
                    ${group.map(publicProjectCard).join("")}
                </div>
            </section>`;
    }).join("");
  }

  if (!content.trim()) {
    content = `<div class="projects-empty"><p>Belum ada proyek yang cocok dengan kategori portfolio saat ini.</p></div>`;
  }

  return htmlDocument(
    "Projects",
    `${publicNavbar("projects")}

    <main class="projects-shell">
        <header class="projects-hero">
            <span>Portfolio Collection</span>
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

            ${content}
        </section>
    </main>

    ${footer("&copy; 2025 Dr")}`,
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

    ${footer("&copy; 2025 Dr")}`,
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
                    <label class="form-group-label">File (Max 10MB)</label>
                    <input type="file" name="file" class="form-input" required>
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
                    <label class="form-group-label">Ganti File (Opsional)</label>
                    <input type="file" name="file" class="form-input">
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
    </div>`,
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
            <span>Writing</span>
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

    ${footer(`&copy; ${new Date().getUTCFullYear()} Dr`)}`,
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

    ${footer(`&copy; ${new Date().getUTCFullYear()} Dr`)}`,
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
    </div>`,
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
                        <input type="file" name="image" id="blog-image" class="form-input" accept="image/*">
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
    </div>`,
    "admin-page",
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

import { compareSync, hashSync } from "bcryptjs";
import {
  blogSlugExists,
  countUsersByEmail,
  createBlog,
  createComment,
  createProject,
  createUser,
  deleteBlog,
  deleteProject,
  findBlogById,
  findProjectById,
  findPublishedBlogBySlug,
  findUserByEmail,
  findUserById,
  getCommentRateLimit,
  getDashboardSummary,
  hitCommentRateLimit,
  listBlogsForUser,
  listComments,
  listProjectsForPublic,
  listProjectsForUser,
  listPublishedBlogs,
  updateBlog,
  updateProject,
} from "./repositories/data";
import {
  buildBlogStorageKey,
  buildProjectStorageKey,
  formFile,
  formString,
  getCommentRateLimitMax,
  getCommentRateLimitWindowSeconds,
  isDebug,
  isEmail,
  normalizeMethod,
  slugify,
  sqlNow,
} from "./lib/utils";
import {
  commitSession,
  loadSession,
  pullFlash,
  pullIntendedPath,
  regenerateSession,
  resetSession,
  setFlash,
  setIntendedPath,
  verifyCsrfToken,
} from "./lib/session";
import { ensureSchema } from "./lib/schema";
import type { Blog, Env, FlashData, Project, SessionState, User } from "./types";
import {
  renderBlogIndexPage,
  renderBlogShowPage,
  renderCommentsPage,
  renderDashboardBlogsPage,
  renderDashboardPage,
  renderDashboardProjectsPage,
  renderErrorPage,
  renderHomePage,
  renderLoginPage,
  renderProjectsPage,
  renderRegisterPage,
} from "./views/pages";

const PROJECT_CATEGORIES = ["design", "pdf", "cybersecurity", "tutorial", "certificate"] as const;
const PUBLIC_PROJECT_FILTERS = ["design", "pdf", "cybersecurity", "tutorial", "certificate"] as const;
const BLOG_STATUSES = ["draft", "published"] as const;

function html(content: string, status = 200, headers?: HeadersInit): Response {
  return new Response(content, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ...headers,
    },
  });
}

function text(content: string, status = 200, headers?: HeadersInit): Response {
  return new Response(content, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...headers,
    },
  });
}

function redirect(location: string, status = 302): Response {
  return new Response(null, {
    status,
    headers: {
      Location: location,
    },
  });
}

function applySecurityHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response);

  newResponse.headers.set("X-Content-Type-Options", "nosniff");
  newResponse.headers.set("X-Frame-Options", "SAMEORIGIN");
  newResponse.headers.set("X-XSS-Protection", "1; mode=block");
  newResponse.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self';"
  );

  return newResponse;
}

async function maybeReadFormData(request: Request): Promise<FormData | null> {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD") {
    return null;
  }

  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.includes("multipart/form-data") && !contentType.includes("application/x-www-form-urlencoded")) {
    return null;
  }

  try {
    return await request.clone().formData();
  } catch {
    return null;
  }
}

function oldInputs(formData: FormData | null, keys: string[]): Record<string, string> {
  const old: Record<string, string> = {};
  for (const key of keys) {
    old[key] = formString(formData, key);
  }
  return old;
}

function validateRequiredText(value: string, field: string, errors: Record<string, string>, options: {
  max?: number;
  min?: number;
  email?: boolean;
} = {}): string {
  if (!value) {
    errors[field] = `The ${field.replaceAll("_", " ")} field is required.`;
    return "";
  }

  if (options.email && !isEmail(value)) {
    errors[field] = `The ${field.replaceAll("_", " ")} field must be a valid email address.`;
  }

  if (options.min && value.length < options.min) {
    errors[field] = `The ${field.replaceAll("_", " ")} field must be at least ${options.min} characters.`;
  }

  if (options.max && value.length > options.max) {
    errors[field] = `The ${field.replaceAll("_", " ")} field must not be greater than ${options.max} characters.`;
  }

  return value;
}

function validateOptionalText(value: string, field: string, errors: Record<string, string>, options: {
  max?: number;
} = {}): string | null {
  if (!value) {
    return null;
  }

  if (options.max && value.length > options.max) {
    errors[field] = `The ${field.replaceAll("_", " ")} field must not be greater than ${options.max} characters.`;
  }

  return value;
}

function validateChoice<T extends string>(value: string, field: string, allowed: readonly T[], errors: Record<string, string>): T | null {
  if (!value) {
    errors[field] = `The ${field.replaceAll("_", " ")} field is required.`;
    return null;
  }

  if (!allowed.includes(value as T)) {
    errors[field] = `The selected ${field.replaceAll("_", " ")} is invalid.`;
    return null;
  }

  return value as T;
}

function validateDateTime(value: string, field: string, errors: Record<string, string>): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.includes("T") ? `${value}:00` : value;
  const asDate = new Date(normalized.endsWith("Z") ? normalized : `${normalized}Z`);
  if (Number.isNaN(asDate.getTime())) {
    errors[field] = `The ${field.replaceAll("_", " ")} is not a valid date.`;
    return null;
  }

  return normalized.replace("T", " ").replace("Z", "");
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) {
    return true;
  }

  return /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(file.name);
}

function validateFile(file: File | null, field: string, errors: Record<string, string>, options: {
  required?: boolean;
  maxKb: number;
  image?: boolean;
}): File | null {
  if (!file) {
    if (options.required) {
      errors[field] = `The ${field.replaceAll("_", " ")} field is required.`;
    }
    return null;
  }

  if (options.image && !isImageFile(file)) {
    errors[field] = `The ${field.replaceAll("_", " ")} field must be an image.`;
  }

  if (file.size > options.maxKb * 1024) {
    errors[field] = `The ${field.replaceAll("_", " ")} field must not be greater than ${options.maxKb} kilobytes.`;
  }

  return file;
}

function pageExpired(): Response {
  return html(renderErrorPage("Page Expired", "The page has expired. Please refresh and try again.", 419), 419);
}

function notFound(): Response {
  return html(renderErrorPage("Not Found", "The requested page could not be found.", 404), 404);
}

function forbidden(): Response {
  return html(renderErrorPage("Forbidden", "You do not have permission to access this resource.", 403), 403);
}

function validateCsrf(session: SessionState, formData: FormData | null): boolean {
  const candidate = formString(formData, "_token");
  return verifyCsrfToken(session, candidate);
}

function requireGuest(user: User | null): Response | null {
  return user ? redirect("/dashboard") : null;
}

function requireAuth(user: User | null, session: SessionState, request: Request): Response | null {
  if (user) {
    return null;
  }

  if (request.method.toUpperCase() === "GET" || request.method.toUpperCase() === "HEAD") {
    const url = new URL(request.url);
    setIntendedPath(session, `${url.pathname}${url.search}`);
  }

  return redirect("/login");
}

function normalizeStoredPassword(hash: string): string {
  return hash.startsWith("$2y$") ? `$2a$${hash.slice(4)}` : hash;
}

function hashPassword(password: string): string {
  return hashSync(password, 12);
}

function verifyPassword(password: string, hash: string): boolean {
  return compareSync(password, normalizeStoredPassword(hash));
}

function setValidationFlash(session: SessionState, location: string, errors: Record<string, string>, old: Record<string, string>): Response {
  setFlash(session, { errors, old });
  return redirect(location);
}

async function uploadToR2(env: Env, key: string, file: File): Promise<void> {
  await env.UPLOADS.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type || undefined,
    },
    customMetadata: {
      originalFilename: file.name,
    },
  });
}

async function serveStorageObject(env: Env, key: string): Promise<Response> {
  const object = await env.UPLOADS.get(key);
  if (!object) {
    return notFound();
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=3600");
  return new Response(object.body, { headers });
}

async function handleLogin(env: Env, formData: FormData | null, session: SessionState): Promise<Response> {
  const errors: Record<string, string> = {};
  const email = validateRequiredText(formString(formData, "email"), "email", errors, { email: true });
  const password = validateRequiredText(formString(formData, "password"), "password", errors);

  if (Object.keys(errors).length > 0) {
    return setValidationFlash(session, "/login", errors, oldInputs(formData, ["email"]));
  }

  const user = await findUserByEmail(env, email);
  if (!user || !verifyPassword(password, user.password)) {
    setFlash(session, {
      errors: {
        email: "The provided credentials do not match our records.",
      },
      old: {
        email,
      },
    });
    return redirect("/login");
  }

  regenerateSession(session);
  session.userId = user.id;
  const intended = pullIntendedPath(session) ?? "/dashboard";
  return redirect(intended);
}

async function handleRegister(env: Env, formData: FormData | null, session: SessionState): Promise<Response> {
  const errors: Record<string, string> = {};
  const name = validateRequiredText(formString(formData, "name"), "name", errors, { max: 255 });
  const email = validateRequiredText(formString(formData, "email"), "email", errors, { email: true, max: 255 });
  const password = validateRequiredText(formString(formData, "password"), "password", errors, { min: 8 });
  const passwordConfirmation = formString(formData, "password_confirmation");

  if (password && passwordConfirmation !== password) {
    errors.password = "The password field confirmation does not match.";
  }

  if (email && await countUsersByEmail(env, email) > 0) {
    errors.email = "The email has already been taken.";
  }

  if (Object.keys(errors).length > 0) {
    return setValidationFlash(session, "/register", errors, oldInputs(formData, ["name", "email"]));
  }

  const user = await createUser(env, {
    name,
    email,
    password: hashPassword(password),
  });

  regenerateSession(session);
  session.userId = user.id;
  return redirect("/dashboard");
}

async function handleCommentCreate(env: Env, formData: FormData | null, session: SessionState, user: User | null, request: Request): Promise<Response> {
  const ip = request.headers.get("CF-Connecting-IP") ?? request.headers.get("X-Forwarded-For") ?? "127.0.0.1";
  const key = `send-comment:${ip.split(",")[0].trim()}`;
  const maxAttempts = getCommentRateLimitMax(env);
  const decaySeconds = getCommentRateLimitWindowSeconds(env);
  const current = await getCommentRateLimit(env, key, Math.floor(Date.now() / 1000));

  if (current.attempts >= maxAttempts) {
    const minutes = Math.ceil((current.expiresAt - Math.floor(Date.now() / 1000)) / 60);
    setFlash(session, {
      error: `Terlalu banyak percobaan. Silakan coba lagi dalam ${minutes} menit.`,
    });
    return redirect("/comments");
  }

  const errors: Record<string, string> = {};
  const name = validateRequiredText(formString(formData, "name"), "name", errors, { max: 255 });
  const comment = validateRequiredText(formString(formData, "comment"), "comment", errors, { max: 1000 });

  if (Object.keys(errors).length > 0) {
    return setValidationFlash(session, "/comments", errors, oldInputs(formData, ["name", "comment"]));
  }

  await createComment(env, {
    name,
    comment,
    userId: user?.id ?? null,
  });
  await hitCommentRateLimit(env, key, Math.floor(Date.now() / 1000), decaySeconds);

  setFlash(session, {
    success: "Komentar berhasil dikirim!",
  });
  return redirect("/comments");
}

async function handleProjectCreate(env: Env, formData: FormData | null, session: SessionState, user: User): Promise<Response> {
  const errors: Record<string, string> = {};
  const title = validateRequiredText(formString(formData, "title"), "title", errors, { max: 255 });
  const description = validateOptionalText(formString(formData, "description"), "description", errors, { max: 1000 });
  const category = validateChoice(formString(formData, "category"), "category", PROJECT_CATEGORIES, errors);
  const file = validateFile(formFile(formData, "file"), "file", errors, { required: true, maxKb: 10240 });

  if (Object.keys(errors).length > 0) {
    return setValidationFlash(session, "/dashboard/projects", errors, oldInputs(formData, ["title", "description", "category"]));
  }

  try {
    const key = buildProjectStorageKey(category!, file!.name);
    await uploadToR2(env, key, file!);
    await createProject(env, {
      userId: user.id,
      title,
      description,
      category: category!,
      filePath: key,
      originalFilename: file!.name,
      fileSize: file!.size,
    });

    setFlash(session, { success: "Project berhasil diupload!" });
    return redirect("/dashboard/projects");
  } catch (error) {
    setFlash(session, { error: `Gagal mengupload project: ${error instanceof Error ? error.message : "Unknown error"}` });
    return redirect("/dashboard/projects");
  }
}

async function handleProjectUpdate(env: Env, formData: FormData | null, session: SessionState, user: User, projectId: number): Promise<Response> {
  const project = await findProjectById(env, projectId);
  if (!project) {
    return notFound();
  }

  if (project.userId !== user.id) {
    setFlash(session, { error: "Anda tidak memiliki izin untuk mengedit project ini." });
    return redirect("/dashboard/projects");
  }

  const errors: Record<string, string> = {};
  const title = validateRequiredText(formString(formData, "title"), "title", errors, { max: 255 });
  const description = validateOptionalText(formString(formData, "description"), "description", errors, { max: 1000 });
  const category = validateChoice(formString(formData, "category"), "category", PROJECT_CATEGORIES, errors);
  const file = validateFile(formFile(formData, "file"), "file", errors, { required: false, maxKb: 10240 });

  if (Object.keys(errors).length > 0) {
    return setValidationFlash(session, "/dashboard/projects", errors, oldInputs(formData, ["title", "description", "category"]));
  }

  try {
    if (file) {
      if (project.filePath) {
        await env.UPLOADS.delete(project.filePath);
      }
      const key = buildProjectStorageKey(category!, file.name);
      await uploadToR2(env, key, file);
      project.filePath = key;
      project.originalFilename = file.name;
      project.fileSize = file.size;
    }

    project.title = title;
    project.description = description;
    project.category = category!;
    await updateProject(env, project);

    setFlash(session, { success: "Project berhasil diperbarui!" });
    return redirect("/dashboard/projects");
  } catch (error) {
    setFlash(session, { error: `Gagal memperbarui project: ${error instanceof Error ? error.message : "Unknown error"}` });
    return redirect("/dashboard/projects");
  }
}

async function handleProjectDelete(env: Env, session: SessionState, user: User, projectId: number): Promise<Response> {
  const project = await findProjectById(env, projectId);
  if (!project) {
    return notFound();
  }

  if (project.userId !== user.id) {
    setFlash(session, { error: "Anda tidak memiliki izin untuk menghapus project ini." });
    return redirect("/dashboard/projects");
  }

  try {
    if (project.filePath) {
      await env.UPLOADS.delete(project.filePath);
    }
    await deleteProject(env, project.id);
    setFlash(session, { success: "Project berhasil dihapus!" });
    return redirect("/dashboard/projects");
  } catch (error) {
    setFlash(session, { error: `Gagal menghapus project: ${error instanceof Error ? error.message : "Unknown error"}` });
    return redirect("/dashboard/projects");
  }
}

async function handleBlogCreate(env: Env, formData: FormData | null, session: SessionState, user: User): Promise<Response> {
  const errors: Record<string, string> = {};
  const title = validateRequiredText(formString(formData, "title"), "title", errors, { max: 255 });
  const subtitle = validateOptionalText(formString(formData, "subtitle"), "subtitle", errors, { max: 255 });
  const image = validateFile(formFile(formData, "image"), "image", errors, { required: false, maxKb: 2048, image: true });
  const content = validateRequiredText(formString(formData, "content"), "content", errors);
  const status = validateChoice(formString(formData, "status"), "status", BLOG_STATUSES, errors);
  const publishedAt = validateDateTime(formString(formData, "published_at"), "published_at", errors);

  if (Object.keys(errors).length > 0) {
    return setValidationFlash(session, "/dashboard/blogs", errors, oldInputs(formData, ["title", "subtitle", "content", "status", "published_at"]));
  }

  let slug = slugify(title);
  if (await blogSlugExists(env, slug)) {
    slug = `${slug}-${Math.floor(Date.now() / 1000)}`;
  }

  let imagePath: string | null = null;
  if (image) {
    imagePath = buildBlogStorageKey(image.name);
    await uploadToR2(env, imagePath, image);
  }

  await createBlog(env, {
    userId: user.id,
    title,
    subtitle,
    image: imagePath,
    slug,
    content,
    status: status!,
    publishedAt: status === "published" ? (publishedAt ?? sqlNow()) : null,
  });

  setFlash(session, { success: "Blog created successfully." });
  return redirect("/dashboard/blogs");
}

async function handleBlogUpdate(env: Env, formData: FormData | null, session: SessionState, user: User, blogId: number): Promise<Response> {
  const blog = await findBlogById(env, blogId);
  if (!blog) {
    return notFound();
  }

  if (blog.userId !== user.id) {
    return forbidden();
  }

  const errors: Record<string, string> = {};
  const title = validateRequiredText(formString(formData, "title"), "title", errors, { max: 255 });
  const subtitle = validateOptionalText(formString(formData, "subtitle"), "subtitle", errors, { max: 255 });
  const image = validateFile(formFile(formData, "image"), "image", errors, { required: false, maxKb: 2048, image: true });
  const content = validateRequiredText(formString(formData, "content"), "content", errors);
  const status = validateChoice(formString(formData, "status"), "status", BLOG_STATUSES, errors);
  const publishedAt = validateDateTime(formString(formData, "published_at"), "published_at", errors);

  if (Object.keys(errors).length > 0) {
    return setValidationFlash(session, "/dashboard/blogs", errors, oldInputs(formData, ["title", "subtitle", "content", "status", "published_at"]));
  }

  if (image) {
    if (blog.image) {
      await env.UPLOADS.delete(blog.image);
    }
    blog.image = buildBlogStorageKey(image.name);
    await uploadToR2(env, blog.image, image);
  }

  blog.title = title;
  blog.subtitle = subtitle;
  blog.content = content;
  blog.status = status!;
  blog.publishedAt = status === "published" ? (publishedAt ?? blog.publishedAt ?? sqlNow()) : null;

  await updateBlog(env, blog);
  setFlash(session, { success: "Blog updated successfully." });
  return redirect("/dashboard/blogs");
}

async function handleBlogDelete(env: Env, session: SessionState, user: User, blogId: number): Promise<Response> {
  const blog = await findBlogById(env, blogId);
  if (!blog) {
    return notFound();
  }

  if (blog.userId !== user.id) {
    return forbidden();
  }

  if (blog.image) {
    await env.UPLOADS.delete(blog.image);
  }
  await deleteBlog(env, blog.id);
  setFlash(session, { success: "Blog deleted successfully." });
  return redirect("/dashboard/blogs");
}

async function routeRequest(request: Request, env: Env, session: SessionState, flash: FlashData, user: User | null, formData: FormData | null, method: string): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (method !== "GET" && method !== "HEAD" && !validateCsrf(session, formData)) {
    return pageExpired();
  }

  if (method === "GET" && path === "/") {
    return html(renderHomePage());
  }

  if (method === "GET" && path === "/projects") {
    const category = url.searchParams.get("category");
    const selectedCategory = category && PUBLIC_PROJECT_FILTERS.includes(category as (typeof PUBLIC_PROJECT_FILTERS)[number]) ? category : null;
    const projects = await listProjectsForPublic(env, selectedCategory ?? undefined);
    return html(renderProjectsPage(projects, selectedCategory));
  }

  if (method === "GET" && path === "/comments") {
    const comments = await listComments(env);
    return html(renderCommentsPage({ comments, currentUser: user, flash, csrfToken: session.payload.csrfToken }));
  }

  if (method === "POST" && path === "/comments") {
    return handleCommentCreate(env, formData, session, user, request);
  }

  if (method === "GET" && path === "/login") {
    const guestRedirect = requireGuest(user);
    if (guestRedirect) {
      return guestRedirect;
    }
    return html(renderLoginPage(flash, session.payload.csrfToken));
  }

  if (method === "POST" && path === "/login") {
    const guestRedirect = requireGuest(user);
    if (guestRedirect) {
      return guestRedirect;
    }
    return handleLogin(env, formData, session);
  }

  if (method === "GET" && path === "/register") {
    const guestRedirect = requireGuest(user);
    if (guestRedirect) {
      return guestRedirect;
    }
    return html(renderRegisterPage(flash, session.payload.csrfToken));
  }

  if (method === "POST" && path === "/register") {
    const guestRedirect = requireGuest(user);
    if (guestRedirect) {
      return guestRedirect;
    }
    return handleRegister(env, formData, session);
  }

  if (method === "POST" && path === "/logout") {
    const authRedirect = requireAuth(user, session, request);
    if (authRedirect) {
      return authRedirect;
    }
    resetSession(session);
    return redirect("/");
  }

  if (method === "GET" && path === "/dashboard") {
    const authRedirect = requireAuth(user, session, request);
    if (authRedirect) {
      return authRedirect;
    }
    const summary = await getDashboardSummary(env, user!.id);
    return html(renderDashboardPage(summary, session.payload.csrfToken, flash));
  }

  if (method === "GET" && path === "/dashboard/projects") {
    const authRedirect = requireAuth(user, session, request);
    if (authRedirect) {
      return authRedirect;
    }
    const projects = await listProjectsForUser(env, user!.id);
    return html(renderDashboardProjectsPage({ projects, flash, csrfToken: session.payload.csrfToken }));
  }

  if (method === "POST" && path === "/dashboard/projects") {
    const authRedirect = requireAuth(user, session, request);
    if (authRedirect) {
      return authRedirect;
    }
    return handleProjectCreate(env, formData, session, user!);
  }

  const projectMatch = path.match(/^\/dashboard\/projects\/(\d+)$/);
  if (projectMatch && (method === "PUT" || method === "DELETE")) {
    const authRedirect = requireAuth(user, session, request);
    if (authRedirect) {
      return authRedirect;
    }
    const projectId = Number(projectMatch[1]);
    return method === "PUT"
      ? handleProjectUpdate(env, formData, session, user!, projectId)
      : handleProjectDelete(env, session, user!, projectId);
  }

  if (method === "GET" && path === "/dashboard/blogs") {
    const authRedirect = requireAuth(user, session, request);
    if (authRedirect) {
      return authRedirect;
    }
    const blogs = await listBlogsForUser(env, user!.id);
    return html(renderDashboardBlogsPage({ blogs, flash, csrfToken: session.payload.csrfToken }));
  }

  if (method === "GET" && path === "/dashboard/blogs/create") {
    const authRedirect = requireAuth(user, session, request);
    if (authRedirect) {
      return authRedirect;
    }
    return redirect("/dashboard/blogs");
  }

  if (method === "POST" && path === "/dashboard/blogs") {
    const authRedirect = requireAuth(user, session, request);
    if (authRedirect) {
      return authRedirect;
    }
    return handleBlogCreate(env, formData, session, user!);
  }

  const blogEditMatch = path.match(/^\/dashboard\/blogs\/(\d+)\/edit$/);
  if (blogEditMatch && method === "GET") {
    const authRedirect = requireAuth(user, session, request);
    if (authRedirect) {
      return authRedirect;
    }
    const blog = await findBlogById(env, Number(blogEditMatch[1]));
    if (!blog) {
      return notFound();
    }
    if (blog.userId !== user!.id) {
      return forbidden();
    }
    return redirect("/dashboard/blogs");
  }

  const blogMatch = path.match(/^\/dashboard\/blogs\/(\d+)$/);
  if (blogMatch && method === "GET") {
    const authRedirect = requireAuth(user, session, request);
    if (authRedirect) {
      return authRedirect;
    }
    return notFound();
  }

  if (blogMatch && (method === "PUT" || method === "PATCH" || method === "DELETE")) {
    const authRedirect = requireAuth(user, session, request);
    if (authRedirect) {
      return authRedirect;
    }
    const blogId = Number(blogMatch[1]);
    if (method === "DELETE") {
      return handleBlogDelete(env, session, user!, blogId);
    }
    return handleBlogUpdate(env, formData, session, user!, blogId);
  }

  if (method === "GET" && path === "/blog") {
    const blogs = await listPublishedBlogs(env);
    return html(renderBlogIndexPage(blogs));
  }

  const publicBlogMatch = path.match(/^\/blog\/([^/]+)$/);
  if (publicBlogMatch && method === "GET") {
    const blog = await findPublishedBlogBySlug(env, decodeURIComponent(publicBlogMatch[1]));
    return blog ? html(renderBlogShowPage(blog)) : notFound();
  }

  const downloadMatch = path.match(/^\/project\/(\d+)\/download$/);
  if (downloadMatch && method === "GET") {
    const project = await findProjectById(env, Number(downloadMatch[1]));
    if (!project) {
      return notFound();
    }

    const object = await env.UPLOADS.get(project.filePath);
    if (!object) {
      return notFound();
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("Cache-Control", "private, no-store");
    headers.set("Content-Disposition", `attachment; filename="${project.originalFilename.replaceAll('"', "")}"`);
    return new Response(object.body, { headers });
  }

  const storageMatch = path.match(/^\/storage\/(.+)$/);
  if (storageMatch && method === "GET") {
    const key = storageMatch[1].split("/").map((segment) => decodeURIComponent(segment)).join("/");
    return serveStorageObject(env, key);
  }

  if (method === "GET" && path === "/fix-storage") {
    return text("Storage link created!");
  }

  if (method === "GET" && path === "/git-test") {
    return text("GIT DEPLOY OK 🚀");
  }

  return null;
}

async function serveAssetsOr404(request: Request, env: Env): Promise<Response> {
  if (env.ASSETS) {
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) {
      return assetResponse;
    }
  }

  return notFound();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    await ensureSchema(env);
    const formData = await maybeReadFormData(request);
    const method = normalizeMethod(request.method, formData);
    const session = await loadSession(request, env);
    const flash = pullFlash(session);

    let user: User | null = null;
    if (session.userId) {
      user = await findUserById(env, session.userId);
      if (!user) {
        session.userId = null;
        session.dirty = true;
      }
    }

    let response: Response;
    try {
      const routed = await routeRequest(request, env, session, flash, user, formData, method);
      response = routed ?? await serveAssetsOr404(request, env);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      response = html(renderErrorPage("Internal Server Error", isDebug(env) ? message : "Internal Server Error", 500), 500);
    }

    response = applySecurityHeaders(response);
    return commitSession(request, env, session, response);
  },
};

import type { Blog, BlogContentBlock, BlogContentBlockType, Comment, DashboardSummary, Env, Project, User } from "../types";
import { sqlNow } from "../lib/utils";

interface CacheRow {
  key: string;
  value: string;
  expiration: number;
}

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

async function allRows<T>(statement: D1PreparedStatement): Promise<T[]> {
  const result = await statement.all<T>();
  return result.results ?? [];
}

function mapUser(row: Record<string, unknown>): User {
  return {
    id: toNumber(row.id),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    password: String(row.password ?? ""),
    emailVerifiedAt: row.email_verified_at ? String(row.email_verified_at) : null,
    rememberToken: row.remember_token ? String(row.remember_token) : null,
    createdAt: row.created_at ? String(row.created_at) : null,
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  };
}

function mapProject(row: Record<string, unknown>): Project {
  return {
    id: toNumber(row.id),
    userId: toNumber(row.user_id),
    title: String(row.title ?? ""),
    description: row.description ? String(row.description) : null,
    category: String(row.category ?? ""),
    filePath: String(row.file_path ?? ""),
    originalFilename: String(row.original_filename ?? ""),
    fileSize: toNumber(row.file_size),
    createdAt: row.created_at ? String(row.created_at) : null,
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  };
}

function mapComment(row: Record<string, unknown>): Comment {
  return {
    id: toNumber(row.id),
    name: String(row.name ?? ""),
    comment: String(row.comment ?? ""),
    userId: row.user_id == null ? null : toNumber(row.user_id),
    ipAddress: row.ip_address ? String(row.ip_address) : null,
    createdAt: row.created_at ? String(row.created_at) : null,
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  };
}

const BLOG_BLOCK_TYPES: BlogContentBlockType[] = ["paragraph", "heading", "blockquote", "code", "image"];

function parseTags(value: unknown): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(String(value));
    if (Array.isArray(parsed)) {
      return parsed.map((tag) => String(tag).trim()).filter(Boolean);
    }
  } catch {
    return String(value).split(",").map((tag) => tag.trim()).filter(Boolean);
  }

  return [];
}

function parseContentBlocks(value: unknown, fallbackContent: string): BlogContentBlock[] {
  if (value) {
    try {
      const parsed = JSON.parse(String(value));
      if (Array.isArray(parsed)) {
        return parsed.flatMap((item): BlogContentBlock[] => {
          const candidate = item as Partial<BlogContentBlock>;
          if (!candidate || !BLOG_BLOCK_TYPES.includes(candidate.type as BlogContentBlockType)) {
            return [];
          }

          const block: BlogContentBlock = {
            type: candidate.type as BlogContentBlockType,
            value: String(candidate.value ?? "").trim(),
          };

          if (candidate.caption) {
            block.caption = String(candidate.caption).trim();
          }

          if (candidate.language) {
            block.language = String(candidate.language).trim();
          }

          return block.value ? [block] : [];
        });
      }
    } catch {
      // Fall back to the legacy content field below.
    }
  }

  const content = fallbackContent.trim();
  return content ? [{ type: "paragraph", value: content }] : [];
}

function mapBlog(row: Record<string, unknown>): Blog {
  const content = String(row.content ?? "");

  return {
    id: toNumber(row.id),
    userId: toNumber(row.user_id),
    title: String(row.title ?? ""),
    subtitle: row.subtitle ? String(row.subtitle) : null,
    slug: String(row.slug ?? ""),
    category: row.category ? String(row.category) : null,
    content,
    contentBlocks: parseContentBlocks(row.content_blocks, content),
    excerpt: row.excerpt ? String(row.excerpt) : null,
    thumbnail: row.thumbnail ? String(row.thumbnail) : null,
    metaTitle: row.meta_title ? String(row.meta_title) : null,
    metaDescription: row.meta_description ? String(row.meta_description) : null,
    status: String(row.status ?? "draft") as "draft" | "published",
    publishedAt: row.published_at ? String(row.published_at) : null,
    image: row.image ? String(row.image) : null,
    imageCaption: row.image_caption ? String(row.image_caption) : null,
    tags: parseTags(row.tags),
    createdAt: row.created_at ? String(row.created_at) : null,
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  };
}

export async function findUserByEmail(env: Env, email: string): Promise<User | null> {
  const row = await env.DB.prepare("SELECT * FROM users WHERE email = ? LIMIT 1").bind(email).first<Record<string, unknown>>();
  return row ? mapUser(row) : null;
}

export async function findUserById(env: Env, id: number): Promise<User | null> {
  const row = await env.DB.prepare("SELECT * FROM users WHERE id = ? LIMIT 1").bind(id).first<Record<string, unknown>>();
  return row ? mapUser(row) : null;
}

export async function createUser(env: Env, data: { name: string; email: string; password: string }): Promise<User> {
  const now = sqlNow();
  const result = await env.DB.prepare(
    "INSERT INTO users (name, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
  ).bind(data.name, data.email, data.password, now, now).run();

  const id = Number(result.meta?.last_row_id);
  const user = await findUserById(env, id);
  if (!user) {
    throw new Error("User could not be loaded after creation.");
  }

  return user;
}

export async function countUsersByEmail(env: Env, email: string): Promise<number> {
  const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM users WHERE email = ?").bind(email).first<{ count: number }>();
  return Number(row?.count ?? 0);
}

export async function listComments(env: Env): Promise<Comment[]> {
  const rows = await allRows<Record<string, unknown>>(
    env.DB.prepare("SELECT * FROM comments ORDER BY created_at DESC, id DESC"),
  );
  return rows.map(mapComment);
}

export async function createComment(env: Env, data: { name: string; comment: string; userId: number | null; ipAddress: string | null }): Promise<void> {
  const now = sqlNow();
  await env.DB.prepare(
    "INSERT INTO comments (name, comment, user_id, ip_address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).bind(data.name, data.comment, data.userId, data.ipAddress, now, now).run();
}

export async function getCommentRateLimit(env: Env, key: string, nowUnix: number): Promise<{ attempts: number; expiresAt: number }> {
  const row = await env.DB.prepare("SELECT key, value, expiration FROM cache WHERE key = ? LIMIT 1").bind(key).first<CacheRow>();
  if (!row || Number(row.expiration) <= nowUnix) {
    return { attempts: 0, expiresAt: 0 };
  }

  return {
    attempts: Number.parseInt(row.value ?? "0", 10) || 0,
    expiresAt: Number(row.expiration),
  };
}

export async function hitCommentRateLimit(env: Env, key: string, nowUnix: number, decaySeconds: number): Promise<void> {
  const current = await getCommentRateLimit(env, key, nowUnix);
  const attempts = current.expiresAt > nowUnix ? current.attempts + 1 : 1;
  const expiration = current.expiresAt > nowUnix ? current.expiresAt : nowUnix + decaySeconds;

  await env.DB.prepare(
    `INSERT INTO cache (key, value, expiration)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, expiration = excluded.expiration`,
  ).bind(key, String(attempts), expiration).run();
}

export async function clearRateLimit(env: Env, key: string): Promise<void> {
  await env.DB.prepare("DELETE FROM cache WHERE key = ?").bind(key).run();
}

export async function listProjectsForPublic(env: Env, category?: string): Promise<Project[]> {
  const rows = category
    ? await allRows<Record<string, unknown>>(
      env.DB.prepare("SELECT * FROM projects WHERE category = ? ORDER BY created_at DESC, id DESC").bind(category),
    )
    : await allRows<Record<string, unknown>>(
      env.DB.prepare("SELECT * FROM projects ORDER BY created_at DESC, id DESC"),
    );

  return rows.map(mapProject);
}

export async function listProjectsForUser(env: Env, userId: number): Promise<Project[]> {
  const rows = await allRows<Record<string, unknown>>(
    env.DB.prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC, id DESC").bind(userId),
  );
  return rows.map(mapProject);
}

export async function listRecentProjectsForUser(env: Env, userId: number, limit: number): Promise<Project[]> {
  const rows = await allRows<Record<string, unknown>>(
    env.DB.prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?").bind(userId, limit),
  );
  return rows.map(mapProject);
}

export async function countProjectsForUser(env: Env, userId: number): Promise<number> {
  const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM projects WHERE user_id = ?").bind(userId).first<{ count: number }>();
  return Number(row?.count ?? 0);
}

export async function findProjectById(env: Env, id: number): Promise<Project | null> {
  const row = await env.DB.prepare("SELECT * FROM projects WHERE id = ? LIMIT 1").bind(id).first<Record<string, unknown>>();
  return row ? mapProject(row) : null;
}

export async function createProject(env: Env, data: {
  userId: number;
  title: string;
  description: string | null;
  category: string;
  filePath: string;
  originalFilename: string;
  fileSize: number;
}): Promise<Project> {
  const now = sqlNow();
  const result = await env.DB.prepare(
    `INSERT INTO projects
      (user_id, title, description, category, file_path, original_filename, file_size, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    data.userId,
    data.title,
    data.description,
    data.category,
    data.filePath,
    data.originalFilename,
    data.fileSize,
    now,
    now,
  ).run();

  const project = await findProjectById(env, Number(result.meta?.last_row_id ?? 0));
  if (!project) {
    throw new Error("Created project could not be loaded.");
  }

  return project;
}

export async function updateProject(env: Env, project: Project): Promise<void> {
  await env.DB.prepare(
    `UPDATE projects
     SET title = ?, description = ?, category = ?, file_path = ?, original_filename = ?, file_size = ?, updated_at = ?
     WHERE id = ?`,
  ).bind(
    project.title,
    project.description,
    project.category,
    project.filePath,
    project.originalFilename,
    project.fileSize,
    sqlNow(),
    project.id,
  ).run();
}

export async function deleteProject(env: Env, id: number): Promise<void> {
  await env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();
}

export async function listBlogsForUser(env: Env, userId: number): Promise<Blog[]> {
  const rows = await allRows<Record<string, unknown>>(
    env.DB.prepare("SELECT * FROM blogs WHERE user_id = ? ORDER BY created_at DESC, id DESC").bind(userId),
  );
  return rows.map(mapBlog);
}

export async function listRecentBlogsForUser(env: Env, userId: number, limit: number): Promise<Blog[]> {
  const rows = await allRows<Record<string, unknown>>(
    env.DB.prepare("SELECT * FROM blogs WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?").bind(userId, limit),
  );
  return rows.map(mapBlog);
}

export async function listPublishedBlogs(env: Env): Promise<Blog[]> {
  const rows = await allRows<Record<string, unknown>>(
    env.DB.prepare(
      "SELECT * FROM blogs WHERE status = 'published' ORDER BY published_at DESC, id DESC",
    ),
  );
  return rows.map(mapBlog);
}

export async function findPublishedBlogBySlug(env: Env, slug: string): Promise<Blog | null> {
  const row = await env.DB.prepare(
    "SELECT * FROM blogs WHERE status = 'published' AND slug = ? LIMIT 1",
  ).bind(slug).first<Record<string, unknown>>();
  return row ? mapBlog(row) : null;
}

export async function findBlogById(env: Env, id: number): Promise<Blog | null> {
  const row = await env.DB.prepare("SELECT * FROM blogs WHERE id = ? LIMIT 1").bind(id).first<Record<string, unknown>>();
  return row ? mapBlog(row) : null;
}

export async function blogSlugExists(env: Env, slug: string): Promise<boolean> {
  const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM blogs WHERE slug = ?").bind(slug).first<{ count: number }>();
  return Number(row?.count ?? 0) > 0;
}

export async function createBlog(env: Env, data: {
  userId: number;
  title: string;
  subtitle: string | null;
  category: string | null;
  tags: string[];
  image: string | null;
  imageCaption: string | null;
  slug: string;
  content: string;
  contentBlocks: BlogContentBlock[];
  status: "draft" | "published";
  publishedAt: string | null;
}): Promise<void> {
  const now = sqlNow();
  await env.DB.prepare(
    `INSERT INTO blogs
      (user_id, title, subtitle, category, tags, image, image_caption, slug, content, content_blocks, excerpt, thumbnail, meta_title, meta_description, status, published_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    data.userId,
    data.title,
    data.subtitle,
    data.category,
    JSON.stringify(data.tags),
    data.image,
    data.imageCaption,
    data.slug,
    data.content,
    JSON.stringify(data.contentBlocks),
    null,
    null,
    null,
    null,
    data.status,
    data.publishedAt,
    now,
    now,
  ).run();
}

export async function updateBlog(env: Env, blog: Blog): Promise<void> {
  await env.DB.prepare(
    `UPDATE blogs
     SET title = ?, subtitle = ?, category = ?, tags = ?, image = ?, image_caption = ?, content = ?, content_blocks = ?, status = ?, published_at = ?, updated_at = ?
     WHERE id = ?`,
  ).bind(
    blog.title,
    blog.subtitle,
    blog.category,
    JSON.stringify(blog.tags),
    blog.image,
    blog.imageCaption,
    blog.content,
    JSON.stringify(blog.contentBlocks),
    blog.status,
    blog.publishedAt,
    sqlNow(),
    blog.id,
  ).run();
}

export async function deleteBlog(env: Env, id: number): Promise<void> {
  await env.DB.prepare("DELETE FROM blogs WHERE id = ?").bind(id).run();
}

export async function countBlogsForUser(env: Env, userId: number): Promise<number> {
  const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM blogs WHERE user_id = ?").bind(userId).first<{ count: number }>();
  return Number(row?.count ?? 0);
}

export async function countBlogsForUserByStatus(env: Env, userId: number, status: "draft" | "published"): Promise<number> {
  const row = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM blogs WHERE user_id = ? AND status = ?",
  ).bind(userId, status).first<{ count: number }>();
  return Number(row?.count ?? 0);
}

export async function getDashboardSummary(env: Env, userId: number): Promise<DashboardSummary> {
  const [projectCount, blogCount, publishedBlogCount, draftBlogCount, recentProjects, recentBlogs] = await Promise.all([
    countProjectsForUser(env, userId),
    countBlogsForUser(env, userId),
    countBlogsForUserByStatus(env, userId, "published"),
    countBlogsForUserByStatus(env, userId, "draft"),
    listRecentProjectsForUser(env, userId, 5),
    listRecentBlogsForUser(env, userId, 5),
  ]);

  return {
    projectCount,
    blogCount,
    publishedBlogCount,
    draftBlogCount,
    recentProjects,
    recentBlogs,
  };
}

export interface Env {
  DB: D1Database;
  UPLOADS: R2Bucket;
  ASSETS?: Fetcher;
  APP_NAME?: string;
  APP_URL?: string;
  APP_DEBUG?: string;
  SESSION_COOKIE_NAME?: string;
  SESSION_TTL_MINUTES?: string;
  COMMENTS_RATE_LIMIT_MAX?: string;
  COMMENTS_RATE_LIMIT_WINDOW_SECONDS?: string;
}

export interface FlashData {
  success?: string;
  error?: string;
  errors?: Record<string, string>;
  old?: Record<string, string>;
}

export interface SessionPayload {
  csrfToken: string;
  flash?: FlashData;
  intendedPath?: string;
}

export interface SessionState {
  id: string;
  userId: number | null;
  payload: SessionPayload;
  ipAddress: string | null;
  userAgent: string | null;
  lastActivity: number;
  deletedIds: string[];
  dirty: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  emailVerifiedAt: string | null;
  rememberToken: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Project {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  category: string;
  filePath: string;
  originalFilename: string;
  fileSize: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Comment {
  id: number;
  name: string;
  comment: string;
  userId: number | null;
  ipAddress: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Blog {
  id: number;
  userId: number;
  title: string;
  subtitle: string | null;
  slug: string;
  content: string;
  excerpt: string | null;
  thumbnail: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  status: "draft" | "published";
  publishedAt: string | null;
  image: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface DashboardSummary {
  projectCount: number;
  blogCount: number;
  publishedBlogCount: number;
  draftBlogCount: number;
  recentProjects: Project[];
  recentBlogs: Blog[];
}

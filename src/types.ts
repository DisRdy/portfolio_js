export interface Env {
  DB: D1Database;
  ASSETS?: Fetcher;
  STORAGE: R2Bucket;
  APP_NAME?: string;
  APP_URL?: string;
  APP_DEBUG?: string;
  LOGIN_RATE_LIMIT_MAX?: string;
  LOGIN_RATE_LIMIT_WINDOW_SECONDS?: string;
  REGISTRATION_ENABLED?: string;
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

export interface ProjectApiResource {
  id: number;
  title: string;
  description: string | null;
  category: string;
  originalFilename: string;
  fileSize: number;
  createdAt: string | null;
  viewerUrl: string;
  fileUrl: string;
}

export interface ProjectListApiResponse {
  projects: ProjectApiResource[];
}

export interface ProjectUploadApiResponse {
  project: ProjectApiResource;
}

export interface ApiErrorResponse {
  error: string;
  errors?: Record<string, string>;
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

export type BlogContentBlockType = "paragraph" | "heading" | "blockquote" | "code" | "image";

export interface BlogContentBlock {
  type: BlogContentBlockType;
  value: string;
  caption?: string;
  language?: string;
}

export interface Blog {
  id: number;
  userId: number;
  title: string;
  subtitle: string | null;
  slug: string;
  category: string | null;
  content: string;
  contentBlocks: BlogContentBlock[];
  excerpt: string | null;
  thumbnail: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  status: "draft" | "published";
  publishedAt: string | null;
  image: string | null;
  imageCaption: string | null;
  tags: string[];
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

interface D1Result<T = Record<string, unknown>> {
  results?: T[];
  success?: boolean;
  meta?: {
    duration?: number;
    rows_read?: number;
    rows_written?: number;
    last_row_id?: number;
    changed_db?: boolean;
    changes?: number;
    served_by?: string;
    size_after?: number;
  };
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(columnName?: string): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  raw<T = unknown[]>(options?: { columnNames?: boolean }): Promise<T[]>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<Array<D1Result<T>>>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface R2HTTPMetadata {
  cacheControl?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  contentLanguage?: string;
  contentType?: string;
}

interface R2PutOptions {
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
}

interface R2Object {
  key: string;
  version: string;
  size: number;
  etag: string;
  httpEtag: string;
  uploaded: Date;
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
}

interface R2ObjectBody extends R2Object {
  body: ReadableStream;
  bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  blob(): Promise<Blob>;
  json<T = unknown>(): Promise<T>;
  text(): Promise<string>;
  writeHttpMetadata(headers: Headers): void;
}

interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  put(key: string, value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob, options?: R2PutOptions): Promise<R2Object>;
  delete(key: string): Promise<void>;
}

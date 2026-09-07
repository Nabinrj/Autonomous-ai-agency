export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
}

export const ok = <T>(data: T, meta?: Record<string, unknown>): ApiResponse<T> =>
  meta ? { data, meta } : { data };

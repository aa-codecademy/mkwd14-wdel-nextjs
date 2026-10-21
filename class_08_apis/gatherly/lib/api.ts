import { error } from 'console';

export function apiError(status: number, code: string, message: string, details?: unknown) {
  return Response.json({
    error: { code, message, ...(details ? { details } : {}) },
    status,
  });
}

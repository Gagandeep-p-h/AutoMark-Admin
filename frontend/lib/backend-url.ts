/**
 * Resolves the backend base URL for server-side Next.js route handlers and proxy fetches.
 * In production / Vercel, defaults to the hosted Render backend URL if local env is missing or localhost.
 */
export function getBackendUrl(): string {
  const envUrl =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '');

  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/$/, '');
  }

  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return 'https://automark-backend-wput.onrender.com';
  }

  return (envUrl || 'http://localhost:5001').replace(/\/$/, '');
}

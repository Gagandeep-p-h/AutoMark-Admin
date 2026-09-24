/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL;
    let backendUrl = process.env.BACKEND_INTERNAL_URL;

    if (!backendUrl || backendUrl.includes('automark-backend-wput.onrender.com')) {
      backendUrl = isProd ? 'https://automark-admin.onrender.com' : 'http://localhost:5001';
    }

    return [
      {
        source: '/api/backend/:path*',
        destination: `${backendUrl.replace(/\/$/, '')}/api/:path*`,
      },
    ];
  },
}

export default nextConfig


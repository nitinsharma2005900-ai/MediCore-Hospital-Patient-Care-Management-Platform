/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@medicore/shared', 'lucide-react'],
  output: 'standalone',
  outputFileTracingRoot: require('path').resolve(__dirname, '../..'),
  experimental: { cpus: 2 },
  async headers() {
    return [{ source: '/(.*)', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
    ] }];
  },
  async rewrites() {
    return [
      { source: '/api/v1/:path*', destination: `${process.env.BACKEND_BASE_URL || 'http://127.0.0.1:4010'}/api/v1/:path*` },
      { source: '/analytics/:path*', destination: `${process.env.ANALYTICS_SERVICE_URL || 'http://127.0.0.1:8010'}/analytics/:path*` },
      { source: '/api-docs/:path*', destination: `${process.env.BACKEND_BASE_URL || 'http://127.0.0.1:4010'}/api-docs/:path*` }
    ];
  }
};

module.exports = nextConfig;

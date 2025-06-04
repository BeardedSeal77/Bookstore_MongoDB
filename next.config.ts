/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ]
  },
  // Increase timeout for API routes
  experimental: {
    proxyTimeout: 30000, // 30 seconds
  },
  // Additional server configuration
  serverRuntimeConfig: {
    // Will only be available on the server side
    mySecret: 'secret',
  },
}

module.exports = nextConfig
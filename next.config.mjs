/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true,
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async redirects() {
    return [
      {
        source: '/company/dashboard',
        destination: '/company',
        permanent: false,
      },
      {
        source: '/student/dashboard',
        destination: '/student',
        permanent: false,
      }
    ];
  },
};

export default nextConfig;

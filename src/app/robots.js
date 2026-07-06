export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virudhunagaremploymentconnect.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/register', '/forgot-password', '/reset-password'],
      disallow: [
        '/student/',
        '/company/',
        '/admin/',
        '/college/',
        '/api/',
        '/_next/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

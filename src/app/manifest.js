export default function manifest() {
  return {
    name: 'Virudhunagar Employment Connect',
    short_name: 'VEC Job Fair',
    description: 'AI-Powered Recruitment, Assessment & Placement Platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

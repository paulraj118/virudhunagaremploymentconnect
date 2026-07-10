import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://virudhunagaremploymentconnect.vercel.app'),
  title: {
    default: 'Virudhunagar Employment Connect | Job Fair Portal',
    template: '%s | Virudhunagar Employment Connect',
  },
  description: 'Virudhunagar Employment Connect is an AI-powered job fair and recruitment platform connecting students, colleges, and companies in Tamil Nadu. Register for campus placements and freshers jobs.',
  keywords: ['Virudhunagar jobs', 'Tamil Nadu employment', 'job fair 2026', 'campus placement', 'freshers jobs Tamil Nadu', 'government job fair', 'skill assessment platform', 'placement drive Virudhunagar', 'online recruitment platform', 'AI-powered hiring', 'student placement portal', 'company hiring platform', 'college placement cell', 'career opportunities Tamil Nadu', 'TN employment connect', 'job portal India', 'Virudhunagar district employment', 'StartupTN jobs', 'recruitment drive', 'talent connect platform', 'job assessment test', 'employment exchange online', 'Jobs', 'Recruitment', 'Virudhunagar', 'Employment', 'Job Fair', 'AI Assessment', 'Career', 'Hiring'],
  authors: [{ name: 'Virudhunagar Employment Connect' }],
  creator: 'Virudhunagar Employment Connect',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    title: 'Virudhunagar Employment Connect | Job Fair Portal',
    description: 'AI-Powered Recruitment, Assessment & Placement Platform connecting students, colleges, and companies.',
    siteName: 'Virudhunagar Employment Connect',
    images: [
      {
        url: '/icon.png',
        width: 512,
        height: 512,
        alt: 'Virudhunagar Employment Connect Logo',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Virudhunagar Employment Connect',
    description: 'AI-Powered Recruitment, Assessment & Placement Platform.',
    images: ['/icon.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: '7KqE7m_mrzXZVqoAOEcHJ8_IFW-tGxHTsSCY7_KWPw4',
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://virudhunagaremploymentconnect.vercel.app/#website',
        url: 'https://virudhunagaremploymentconnect.vercel.app',
        name: 'Virudhunagar Employment Connect',
        description: 'AI-Powered Recruitment, Assessment & Placement Platform connecting students, colleges, and companies in Virudhunagar.',
        publisher: {
          '@id': 'https://virudhunagaremploymentconnect.vercel.app/#organization'
        }
      },
      {
        '@type': 'Organization',
        '@id': 'https://virudhunagaremploymentconnect.vercel.app/#organization',
        name: 'Virudhunagar Employment Connect',
        url: 'https://virudhunagaremploymentconnect.vercel.app',
        logo: {
          '@type': 'ImageObject',
          url: 'https://virudhunagaremploymentconnect.vercel.app/icon.png'
        }
      }
    ]
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased bg-slate-50 text-slate-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/providers/auth-provider';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aashiana PG for Women in Hyderabad',
  description: 'Aashiana PG - Premium women\'s hostel and PG accommodation in Hyderabad. Safe, secure, and comfortable living spaces with modern amenities. Book your room today with flexible monthly and daily booking options. Features include WiFi, 24/7 security, housekeeping, meal services, and more.',
  keywords: ['PG Hyderabad', 'Women PG Hyderabad', 'Aashiana PG', 'Hostel Hyderabad', 'PG for Women', 'Student Accommodation Hyderabad', 'Women Hostel', 'PG Booking Hyderabad', 'Safe PG Hyderabad', 'Affordable PG Hyderabad'],
  authors: [{ name: 'Aashiana PG' }],
  openGraph: {
    title: 'Aashiana PG for Women in Hyderabad',
    description: 'Premium women\'s hostel and PG accommodation in Hyderabad. Safe, secure, and comfortable living spaces with modern amenities. Book your room today.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Aashiana PG',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aashiana PG for Women in Hyderabad',
    description: 'Premium women\'s hostel and PG accommodation in Hyderabad. Safe, secure, and comfortable living spaces.',
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}


"use client"; // Make layout a client component to use hooks

import type {Metadata} from 'next';
import {Geist, Geist_Mono, Roboto} from 'next/font/google';
import './globals.css';
import {Navbar} from "@/components/ui/navbar";
import BottomNav from "@/components/ui/bottom-nav";
import {Footer} from "@/components/ui/footer";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { usePathname } from 'next/navigation';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

// Metadata remains static
// export const metadata: Metadata = {
//   title: 'NoteShare',
//   description: 'Shared Notes/Study Materials App',
// };
// Removed metadata export as it needs to be in a Server Component or separate metadata file

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, loading] = useAuthState(auth);
  const pathname = usePathname();

  const showNavigation = !loading && user && pathname !== '/login' && pathname !== '/signup';

  return (
    <html lang="en">
      {/* Add head content here if needed, separate from metadata object */}
      <head>
        <title>NoteShare</title>
        <meta name="description" content="Shared Notes/Study Materials App" />
         {/* Add other head elements like favicons */}
         <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable} antialiased flex flex-col min-h-screen`}>
      {showNavigation && <Navbar/>}
      {/* Adjust main padding based on whether Navbar/BottomNav are shown */}
      <main className={`flex-grow ${showNavigation ? 'pt-16 pb-20' : ''}`}>
        {children}
      </main>
      {showNavigation && <Footer/>}
      {showNavigation && <BottomNav/>}
      <Toaster /> {/* Add Toaster here for app-wide toast notifications */}
      </body>
    </html>
  );
}

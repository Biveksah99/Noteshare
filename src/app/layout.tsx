import type {Metadata} from 'next';
import {Geist, Geist_Mono, Roboto} from 'next/font/google';
import './globals.css';
import {Navbar} from "@/components/ui/navbar";
import BottomNav from "@/components/ui/bottom-nav";
import {Footer} from "@/components/ui/footer";

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

export const metadata: Metadata = {
  title: 'NoteShare',
  description: 'Shared Notes/Study Materials App',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable} antialiased`}>
      <Navbar/>
      <main className="min-h-screen pt-16 pb-20">
        {children}
      </main>
      <Footer/>
      <BottomNav/>
      </body>
    </html>
  );
}

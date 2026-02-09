import './globals.css';
import Sidebar from '@/components/Sidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Build In Public Dashboard',
  description: 'AI Agent Activity Dashboard for X',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">
        <Sidebar />
        <main className="ml-56 p-8 min-h-screen">{children}</main>
      </body>
    </html>
  );
}

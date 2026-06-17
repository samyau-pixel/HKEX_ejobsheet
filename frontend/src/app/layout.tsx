import type { Metadata } from 'next';
import { AuthProvider } from '@/services/auth.service';
import '@/globals.css';

export const metadata: Metadata = {
  title: 'Jobsheet Management System',
  description: 'Role-based jobsheet management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

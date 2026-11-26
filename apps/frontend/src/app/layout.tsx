import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthContext';
import { DemoNotice } from '@/components/DemoNotice';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'MediCore | Hospital, Appointment & Patient Care Platform',
  description: 'Advanced healthcare operations platform with 7-role access control, clinical encounters, concurrency-protected scheduling, and FHIR interoperability.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] antialiased">
        <Providers><AuthProvider>
          <DemoNotice />
          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </AuthProvider></Providers>
      </body>
    </html>
  );
}

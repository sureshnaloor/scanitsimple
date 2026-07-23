import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import 'react-datepicker/dist/react-datepicker.css';
import { Providers } from './providers';
import { Inter } from 'next/font/google';
import LayoutWrapper from './components/LayoutWrapper';
import ConditionalLayout from './components/ConditionalLayout';
import AuthProvider from './providers/AuthProvider';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "SmartTags — Asset Intelligence Platform",
  description: "Every Asset. One Scan. Total Control. Enterprise-grade asset and equipment tagging for modern operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased ${inter.className}`}>
        <Providers>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <ConditionalLayout>
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
              </ConditionalLayout>
            </div>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}

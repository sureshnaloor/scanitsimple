'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogIn, Home, Lock } from 'lucide-react';
import SmartTagsLogo from '@/app/components/SmartTagsLogo';

export default function SignInRequired() {
  const pathname = usePathname();
  const signInUrl = pathname
    ? `/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`
    : '/auth/signin';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B1120] text-white px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto text-center">
        {/* Brand Logo */}
        <div className="flex justify-center mb-8">
          <SmartTagsLogo height={44} />
        </div>

        {/* Card */}
        <div className="bg-[#111827]/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-8 shadow-2xl">
          {/* Lock Icon */}
          <div className="mx-auto w-14 h-14 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-6 text-teal-400">
            <Lock className="w-7 h-7" />
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
            You need to sign in to access
          </h1>

          {/* Subtext */}
          <p className="text-slate-400 text-sm sm:text-base mb-8">
            This section is restricted to authorized users. Please sign in with your account to continue or return to the home page.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {/* Home Button */}
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-600 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-all duration-200 hover:border-slate-500 shadow-sm"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            {/* Sign-In Button */}
            <Link
              href={signInUrl}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign-In</span>
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-xs text-slate-500">
          ScanItSimple &copy; {new Date().getFullYear()} &bull; Secure Asset &amp; Inventory Management
        </p>
      </div>
    </div>
  );
}

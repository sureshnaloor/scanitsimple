'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowRight, QrCode, BarChart3, Shield, Mail, Lock } from 'lucide-react';
import { AnimatedMeshBackground } from '@/app/components/effects/animated-mesh-background';
import { TextReveal } from '@/app/components/effects/text-reveal';
import SmartTagsLogo from '@/app/components/SmartTagsLogo';

export const dynamic = 'force-dynamic';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 800);
      }
    } catch (error) {
      setError('An error occurred during sign in');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <AnimatedMeshBackground intensity="strong" />
        <div className="grid-pattern absolute inset-0 opacity-30" />
        <div className="relative z-10 max-w-md px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <SmartTagsLogo variant="primary" height={56} className="mx-auto mb-8" />
            <h2 className="text-h2 mb-4">
              <TextReveal text="Welcome Back" splitBy="word" />
            </h2>
            <p className="text-body-ds mb-8">
              Sign in to access your asset intelligence dashboard and manage your equipment with precision.
            </p>
          </motion.div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: QrCode, label: 'QR Scanning' },
              { icon: BarChart3, label: 'Analytics' },
              { icon: Shield, label: 'Secure' },
            ].map(({ icon: Icon, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                className="glass-card p-4 text-center"
              >
                <Icon className="mx-auto mb-2 size-6 text-accent-teal" />
                <span className="text-xs text-text-muted">{label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side — Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-4 py-12 bg-slate-50 dark:bg-primary-dark">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <SmartTagsLogo variant="primary" height={48} className="mx-auto" />
          </div>

          <div className="glass-card bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xl rounded-2xl p-8 backdrop-blur-md relative overflow-hidden">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Sign In</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Enter your credentials to access your account</p>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mb-4 rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Mail className="size-5" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 pl-11 pr-4 py-3 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all shadow-sm [&:-webkit-autofill]:shadow-[0_0_0_1000px_#ffffff_inset] dark:[&:-webkit-autofill]:shadow-[0_0_0_1000px_#1e293b_inset] [&:-webkit-autofill]:[text-fill-color:#0f172a] dark:[&:-webkit-autofill]:[text-fill-color:#f8fafc]"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Lock className="size-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 pl-11 pr-11 py-3 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all shadow-sm [&:-webkit-autofill]:shadow-[0_0_0_1000px_#ffffff_inset] dark:[&:-webkit-autofill]:shadow-[0_0_0_1000px_#1e293b_inset] [&:-webkit-autofill]:[text-fill-color:#0f172a] dark:[&:-webkit-autofill]:[text-fill-color:#f8fafc]"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading || isSuccess}
                className="relative w-full overflow-hidden rounded-lg bg-accent-gradient py-3 font-semibold text-white shadow-glow-teal transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
                whileTap={{ scale: 0.98 }}
              >
                <AnimatePresence mode="wait">
                  {isSuccess ? (
                    <motion.span
                      key="success"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="size-5" />
                      Success!
                    </motion.span>
                  ) : isLoading ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <Loader2 className="size-5 animate-spin" />
                      Signing in...
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-2"
                    >
                      Sign In
                      <ArrowRight className="size-4" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-accent-teal hover:text-accent-teal-dark transition-colors block"
              >
                Forgot your password?
              </Link>
              <div className="text-sm text-text-muted">
                Don&apos;t have an account?{' '}
                <Link
                  href="/auth/register"
                  className="text-accent-teal hover:text-accent-teal-dark transition-colors font-medium"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

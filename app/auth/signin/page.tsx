'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowRight, QrCode, BarChart3, Shield } from 'lucide-react';
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
      <div className="flex w-full lg:w-1/2 items-center justify-center px-4 py-12 bg-primary-dark">
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

          <div className="glass-card p-8 relative overflow-hidden">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Sign In</h1>
            <p className="text-sm text-text-muted mb-6">Enter your credentials to access your account</p>

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
              {/* Email field with floating label */}
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="peer w-full rounded-lg border border-primary-light bg-primary-slate/50 px-4 py-3 text-text-primary outline-none transition-all focus:border-accent-teal focus:ring-2 focus:ring-accent-teal/20"
                  placeholder=" "
                  required
                />
                <label
                  htmlFor="email"
                  className="absolute left-4 top-3 text-sm text-text-muted transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-accent-teal peer-focus:bg-primary-dark peer-focus:px-1 peer-not-placeholder-shown:-top-2.5 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:bg-primary-dark peer-not-placeholder-shown:px-1"
                >
                  Email address
                </label>
              </div>

              {/* Password field with floating label + toggle */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="peer w-full rounded-lg border border-primary-light bg-primary-slate/50 px-4 py-3 pr-12 text-text-primary outline-none transition-all focus:border-accent-teal focus:ring-2 focus:ring-accent-teal/20"
                  placeholder=" "
                  required
                />
                <label
                  htmlFor="password"
                  className="absolute left-4 top-3 text-sm text-text-muted transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-accent-teal peer-focus:bg-primary-dark peer-focus:px-1 peer-not-placeholder-shown:-top-2.5 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:bg-primary-dark peer-not-placeholder-shown:px-1"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
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

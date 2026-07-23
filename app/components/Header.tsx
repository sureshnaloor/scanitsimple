'use client';

import Image from 'next/image';
import Link from 'next/link';
import ThemeSwitcher from './ThemeSwitcher';
import SmartTagsLogo from './SmartTagsLogo';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import { useNavigation, useHasMobileSublinks } from '@/app/contexts/NavigationContext';
import { useAppTheme } from '@/app/contexts/ThemeContext';
import { mainNavItems } from '@/lib/navigation-config';
import { cn } from '@/lib/utils';
import {
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  KeyIcon,
  ArrowRightOnRectangleIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';

export default function Header() {
  const { theme } = useAppTheme();
  const { data: session, status } = useSession();
  const { activeSection, setActiveSection, setMobileDrawerOpen } = useNavigation();
  const hasMobileSublinks = useHasMobileSublinks();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getHeaderStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return {
          headerBg: 'bg-[rgba(26,35,50,0.95)] backdrop-blur-lg border-b border-white/10',
          navLink: 'text-white/80 hover:text-teal-400 hover:bg-white/10 border-transparent',
          navLinkActive: 'text-teal-400 bg-white/10 border-white/20',
          navIcon: 'text-teal-400',
          profileMenuBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          profileMenuText: 'text-white border-white/20',
          profileMenuItem: 'text-white hover:text-teal-400 hover:bg-white/10',
          profileMenuIcon: 'text-white/70',
          signOutHover: 'hover:text-red-400',
          signInButton: 'bg-teal-400 hover:bg-teal-500 text-white',
          mobileMenuBg: 'bg-[rgba(26,35,50,0.98)] backdrop-blur-lg border-white/10',
          mobileLink: 'text-white hover:text-teal-400 hover:bg-white/10',
          mobileLinkActive: 'text-teal-400 bg-white/10',
          mobileButton: 'text-white hover:text-teal-400 hover:bg-white/10',
          loadingBg: 'bg-gray-200',
        };
      case 'light':
        return {
          headerBg: 'bg-white border-b-2 border-blue-200 shadow-md',
          navLink: 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-transparent',
          navLinkActive: 'text-blue-700 bg-blue-50 border-blue-200',
          navIcon: 'text-blue-600',
          profileMenuBg: 'bg-white border-2 border-blue-200 shadow-lg',
          profileMenuText: 'text-gray-900 border-blue-200',
          profileMenuItem: 'text-gray-700 hover:text-blue-600 hover:bg-blue-50',
          profileMenuIcon: 'text-gray-500',
          signOutHover: 'hover:text-red-600',
          signInButton: 'bg-blue-600 hover:bg-blue-700 text-white',
          mobileMenuBg: 'bg-white border-t-2 border-blue-200 shadow-lg',
          mobileLink: 'text-gray-700 hover:text-blue-600 hover:bg-blue-50',
          mobileLinkActive: 'text-blue-700 bg-blue-50',
          mobileButton: 'text-gray-700 hover:text-blue-600 hover:bg-blue-50',
          loadingBg: 'bg-gray-300',
        };
      default:
        return {
          headerBg: 'bg-[rgba(11,17,32,0.85)] backdrop-blur-xl border-b border-primary-light/30',
          navLink: 'text-text-secondary hover:text-accent-teal hover:bg-primary-slate border-transparent',
          navLinkActive: 'text-accent-teal bg-accent-teal/10 border-primary-light/50',
          navIcon: 'text-accent-teal',
          profileMenuBg: 'bg-primary-navy/95 backdrop-blur-xl border border-primary-light shadow-ds-lg',
          profileMenuText: 'text-text-primary border-primary-light',
          profileMenuItem: 'text-text-secondary hover:text-accent-teal hover:bg-primary-slate',
          profileMenuIcon: 'text-text-muted',
          signOutHover: 'hover:text-error',
          signInButton: 'bg-cta-gradient hover:brightness-110 text-white shadow-glow-orange',
          mobileMenuBg: 'bg-primary-dark/98 backdrop-blur-xl border-primary-light/30',
          mobileLink: 'text-text-secondary hover:text-accent-teal hover:bg-primary-slate',
          mobileLinkActive: 'text-accent-teal bg-accent-teal/10',
          mobileButton: 'text-text-secondary hover:text-accent-teal hover:bg-primary-slate',
          loadingBg: 'bg-primary-slate',
        };
    }
  };

  const headerStyles = getHeaderStyles();

  const visibleNavItems = mainNavItems.filter(
    (item) => !item.requiresAuth || session
  );

  const renderNavLink = (item: (typeof mainNavItems)[number], isMobile = false) => {
    const isActive = activeSection === item.section;
    const Icon = item.icon;

    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={() => {
          setActiveSection(item.section);
          if (isMobile) setIsMobileMenuOpen(false);
        }}
        className={cn(
          'flex items-center gap-2 transition-all duration-200 rounded-lg text-sm font-medium border',
          isMobile ? 'px-3 py-2.5' : 'px-3 py-2',
          isActive
            ? isMobile
              ? headerStyles.mobileLinkActive
              : headerStyles.navLinkActive
            : isMobile
              ? headerStyles.mobileLink
              : headerStyles.navLink
        )}
      >
        <Icon className={cn('h-4 w-4 shrink-0', headerStyles.navIcon)} />
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <header className={cn('sticky top-0 z-50 w-full shadow-sm', headerStyles.headerBg)}>
      <div className="w-full h-[72px] flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center shrink-0">
          <SmartTagsLogo
            variant="primary"
            height={47}
            priority
            className="shrink-0"
            imageClassName="max-w-[195px] sm:max-w-[221px]"
          />
        </div>

        <nav className="hidden lg:flex items-center justify-center flex-1 px-4">
          <div className="flex items-center flex-wrap justify-center gap-0.5">
            {visibleNavItems.map((item) => renderNavLink(item))}
          </div>
        </nav>

        <div className="flex items-center shrink-0">
          <ThemeSwitcher />

          {status === 'loading' ? (
            <div className="animate-pulse ml-2">
              <div className={cn('h-8 w-8 rounded-full', headerStyles.loadingBg)} />
            </div>
          ) : !session ? (
            <button
              onClick={() => signIn()}
              className={cn(
                'hidden sm:flex items-center gap-2 ml-2 px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 shadow-sm hover:shadow-md',
                headerStyles.signInButton
              )}
            >
              <UserIcon className="h-4 w-4" />
              <span>Sign In</span>
            </button>
          ) : (
            <div className="relative ml-2">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                <div className={cn('relative h-8 w-8 rounded-full', headerStyles.loadingBg)}>
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
                      {session.user?.email?.[0].toUpperCase()}
                    </div>
                  )}
                </div>
              </button>

              {showProfileMenu && (
                <>
                  <div
                    className="absolute right-0 top-full w-full h-2"
                    onMouseEnter={() => setShowProfileMenu(true)}
                  />
                  <div
                    onMouseEnter={() => setShowProfileMenu(true)}
                    onMouseLeave={() => setShowProfileMenu(false)}
                    className={cn(
                      'absolute right-0 top-full mt-2 w-64 rounded-lg py-2 shadow-lg z-50',
                      headerStyles.profileMenuBg
                    )}
                  >
                    <div
                      className={cn(
                        'px-4 py-2.5 text-sm font-medium border-b',
                        headerStyles.profileMenuText
                      )}
                    >
                      {session.user?.email}
                    </div>
                    <div className="py-1">
                      <Link
                        href="/auth/change-password"
                        className={cn(
                          'flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium transition-colors duration-150',
                          headerStyles.profileMenuItem
                        )}
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <KeyIcon className={cn('h-4 w-4', headerStyles.profileMenuIcon)} />
                        <span>Change Password</span>
                      </Link>
                      <button
                        onClick={() => signOut()}
                        className={cn(
                          'flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium transition-colors duration-150',
                          headerStyles.profileMenuItem,
                          headerStyles.signOutHover
                        )}
                      >
                        <ArrowRightOnRectangleIcon
                          className={cn('h-4 w-4', headerStyles.profileMenuIcon)}
                        />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={cn(
              'lg:hidden p-2 ml-2 rounded-lg transition-colors duration-200',
              headerStyles.mobileButton
            )}
            aria-label="Open main menu"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="h-5 w-5" />
            ) : (
              <Bars3Icon className="h-5 w-5" />
            )}
          </button>

          {hasMobileSublinks && (
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className={cn(
                'md:hidden p-2 ml-1 rounded-lg transition-colors duration-200',
                headerStyles.mobileButton
              )}
              aria-label="Open section sub-links"
            >
              <QueueListIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className={cn('lg:hidden border-t shadow-lg', headerStyles.mobileMenuBg)}>
          <div className="px-4 py-4 grid grid-cols-2 gap-1.5">
            {visibleNavItems.map((item) => renderNavLink(item, true))}
          </div>

          {!session && (
            <div
              className={cn(
                'px-4 pb-4 border-t pt-3',
                theme === 'light'
                  ? 'border-blue-200'
                  : theme === 'glassmorphic'
                    ? 'border-white/10'
                    : 'border-primary-light/30'
              )}
            >
              <button
                onClick={() => {
                  signIn();
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200',
                  headerStyles.signInButton
                )}
              >
                <UserIcon className="h-4 w-4" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

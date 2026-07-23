import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-primary-light bg-primary-navy py-3">
      <div className="container mx-auto flex min-h-6 max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
        <div className="text-xs text-text-muted">
          © {new Date().getFullYear()} SmartTags. All rights reserved.
        </div>
        <p className="text-xs italic text-text-muted">Made with precision.</p>
        <div className="flex gap-4 text-xs">
          <Link href="/privacy" className="text-text-muted transition-colors hover:text-accent-teal">
            Privacy
          </Link>
          <Link href="/terms" className="text-text-muted transition-colors hover:text-accent-teal">
            Terms
          </Link>
          <Link href="/contact" className="text-text-muted transition-colors hover:text-accent-teal">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}

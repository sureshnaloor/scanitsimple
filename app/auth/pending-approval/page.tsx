'use client';
import Link from 'next/link';

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Registration Pending Approval</h1>
        
        <div className="text-gray-600 dark:text-gray-300 mb-6">
          <p className="mb-4">
            Your registration request has been submitted successfully. An administrator will review your request and approve your account.
          </p>
          <p>
            You will be able to sign in once your account is approved.
          </p>
        </div>

        <Link 
          href="/auth/signin" 
          className="inline-block bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-white px-6 py-2 rounded-lg transition-colors duration-200"
        >
          Return to Sign In
        </Link>
      </div>
    </div>
  );
}
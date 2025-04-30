import React from 'react';
import Link from 'next/link';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-light-200 dark:bg-dark-800 flex flex-col justify-center">
      <div className="auth-container">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center text-primary-600 dark:text-primary-400">
              <svg 
                className="w-8 h-8" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round"
                />
                <path 
                  d="M20 4V12" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M15 7L20 4L17 9" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              <span className="ml-2 text-xl font-bold">VoiceCraft</span>
            </div>
          </Link>
        </div>
        
        {children}
        
        <div className="mt-8 text-center text-sm text-dark-400 dark:text-light-600">
          <p>© {new Date().getFullYear()} VoiceCraft. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link href="/terms" className="hover:text-primary-600 dark:hover:text-primary-400">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-primary-600 dark:hover:text-primary-400">
              Privacy
            </Link>
            <Link href="/help" className="hover:text-primary-600 dark:hover:text-primary-400">
              Help
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout; 
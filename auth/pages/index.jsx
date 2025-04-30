import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../utils/AuthContext';

const IndexPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading) {
      if (user) {
        if (!user.onboardingComplete) {
          // User needs to complete onboarding
          router.push('/onboarding');
        } else {
          // Redirect to main app
          window.location.href = '/';
        }
      } else {
        // Not logged in, redirect to login
        router.push('/login');
      }
    }
  }, [user, loading, router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-light-200 dark:bg-dark-800">
      <div className="animate-pulse-slow">
        <svg 
          className="w-12 h-12 text-primary-600" 
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
      </div>
    </div>
  );
};

export default IndexPage; 
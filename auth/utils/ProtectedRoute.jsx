import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './AuthContext';

// Higher-order component for protected routes
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check authentication after loading completes
    if (!loading) {
      if (!user) {
        // User is not authenticated, redirect to login
        router.push('/login');
      } else if (!user.onboardingComplete && router.pathname !== '/onboarding') {
        // User hasn't completed onboarding, redirect to onboarding page
        router.push('/onboarding');
      }
    }
  }, [user, loading, router]);

  // Show nothing while checking auth or during redirects
  if (loading || !user) {
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
  }

  // Check if user needs onboarding
  if (!user.onboardingComplete && router.pathname !== '/onboarding') {
    return null; // Don't render anything while redirecting
  }

  // If everything is good, render the children
  return children;
};

export default ProtectedRoute; 
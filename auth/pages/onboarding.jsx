import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AuthLayout from '../components/AuthLayout';
import OnboardingForm from '../components/OnboardingForm';
import { useAuth } from '../utils/AuthContext';

const OnboardingPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // If not authenticated, redirect to login
    if (!loading && !user) {
      router.push('/login');
    }
    
    // If onboarding is already complete, redirect to home
    if (!loading && user && user.onboardingComplete) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  // Show loading state when checking auth or user doesn't exist
  if (loading || !user || user.onboardingComplete) {
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
  
  return (
    <>
      <Head>
        <title>Complete Your Profile | VoiceCraft</title>
        <meta name="description" content="Complete your VoiceCraft profile" />
      </Head>
      
      <AuthLayout>
        <OnboardingForm />
      </AuthLayout>
    </>
  );
};

export default OnboardingPage; 
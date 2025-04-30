import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AuthLayout from '../components/AuthLayout';
import RegisterForm from '../components/RegisterForm';
import { useAuth } from '../utils/AuthContext';

const RegisterPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // Redirect if user is already authenticated
    if (!loading && user) {
      if (!user.onboardingComplete) {
        router.push('/onboarding');
      } else {
        router.push('/');
      }
    }
  }, [user, loading, router]);
  
  // Don't show register page if already authenticated or checking auth
  if (loading || user) {
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
        <title>Create Account | VoiceCraft</title>
        <meta name="description" content="Create your VoiceCraft account" />
      </Head>
      
      <AuthLayout>
        <RegisterForm />
      </AuthLayout>
    </>
  );
};

export default RegisterPage; 
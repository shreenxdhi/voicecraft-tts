import { useState } from 'react';
import { registerWithEmailAndPassword, signInWithGoogle, signInWithGithub, 
  signInWithApple, signInWithMicrosoft, signInWithFacebook } from '../utils/firebase';
import Link from 'next/link';

const RegisterForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }
    
    // Validate password strength
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }
    
    try {
      await registerWithEmailAndPassword(email, password);
      // Successful registration is handled by the AuthContext
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    setError(null);
    
    try {
      switch (provider) {
        case 'google':
          await signInWithGoogle();
          break;
        case 'github':
          await signInWithGithub();
          break;
        case 'apple':
          await signInWithApple();
          break;
        case 'microsoft':
          await signInWithMicrosoft();
          break;
        case 'facebook':
          await signInWithFacebook();
          break;
        default:
          throw new Error('Invalid provider');
      }
      // Successful login is handled by the AuthContext
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h2 className="text-2xl font-bold">Create a VoiceCraft Account</h2>
        <p className="text-dark-400 dark:text-light-600 mt-2">Start your voice journey today</p>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label htmlFor="email" className="form-label">Email address</label>
          <input
            id="email"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="form-label">Password</label>
          <input
            id="password"
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <p className="text-xs text-dark-400 dark:text-light-600 mt-1">
            Must be at least 8 characters
          </p>
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="form-label">Confirm password</label>
          <input
            id="confirmPassword"
            type="password"
            className="form-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        
        <div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </div>
      </form>
      
      <div className="auth-divider">
        <span className="auth-divider-text">or sign up with</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mt-6">
        <button
          type="button"
          className="social-btn"
          onClick={() => handleSocialLogin('google')}
          disabled={loading}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
          </svg>
          Google
        </button>
        
        <button
          type="button"
          className="social-btn"
          onClick={() => handleSocialLogin('github')}
          disabled={loading}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </button>
        
        <button
          type="button"
          className="social-btn"
          onClick={() => handleSocialLogin('microsoft')}
          disabled={loading}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M0 0h11.377v11.372H0zm12.623 0H24v11.372H12.623zM0 12.623h11.377V24H0zm12.623 0H24V24H12.623" />
          </svg>
          Microsoft
        </button>
        
        <button
          type="button"
          className="social-btn"
          onClick={() => handleSocialLogin('apple')}
          disabled={loading}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.79 1.18-.12 2.29-.84 3.5-.83 1.53.03 2.67.69 3.44 1.84-3.26 1.81-2.69 5.94.07 7.16-.67 1.36-1.5 2.7-2.09 4.01zM10.19 7.12c-.14-2.61 2.14-4.87 4.63-5.12.16 2.79-2.48 5.12-4.63 5.12z" />
          </svg>
          Apple
        </button>
      </div>
      
      <div className="text-center mt-6">
        <p className="text-dark-500 dark:text-light-500">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-600 dark:text-primary-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm; 
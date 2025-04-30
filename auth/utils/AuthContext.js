import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          try {
            // Get user profile from Firestore
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            
            if (userDoc.exists()) {
              // User profile exists, merge with Firebase auth data
              const userData = userDoc.data();
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || userData.displayName,
                photoURL: firebaseUser.photoURL,
                emailVerified: firebaseUser.emailVerified,
                ...userData,
                onboardingComplete: !!userData.onboardingComplete,
              });
            } else {
              // New user without profile, use just the Firebase auth data
              // and set onboardingComplete to false
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || '',
                photoURL: firebaseUser.photoURL,
                emailVerified: firebaseUser.emailVerified,
                onboardingComplete: false,
              });
              
              // Create a minimal user document
              await setDoc(doc(db, 'users', firebaseUser.uid), {
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || '',
                createdAt: new Date(),
                onboardingComplete: false,
              });
            }
          } catch (err) {
            console.error('Error fetching user data:', err);
            setError(err.message);
          }
        } else {
          // No user is signed in
          setUser(null);
        }
        
        setLoading(false);
      },
      (err) => {
        console.error('Auth state error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Clean up subscription
    return () => unsubscribe();
  }, []);

  // Complete user onboarding
  const completeOnboarding = async (profileData) => {
    if (!user) return;
    
    try {
      // Update the Firestore document
      await setDoc(doc(db, 'users', user.uid), {
        ...profileData,
        onboardingComplete: true,
        updatedAt: new Date(),
      }, { merge: true });
      
      // Update the local user state
      setUser((prevUser) => ({
        ...prevUser,
        ...profileData,
        onboardingComplete: true,
      }));
      
      return true;
    } catch (err) {
      console.error('Error completing onboarding:', err);
      setError(err.message);
      return false;
    }
  };

  // Update user profile
  const updateUserProfile = async (profileData) => {
    if (!user) return;
    
    try {
      // Update the Firestore document
      await setDoc(doc(db, 'users', user.uid), {
        ...profileData,
        updatedAt: new Date(),
      }, { merge: true });
      
      // Update the local user state
      setUser((prevUser) => ({
        ...prevUser,
        ...profileData,
      }));
      
      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
      return false;
    }
  };

  const value = {
    user,
    loading,
    error,
    completeOnboarding,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 
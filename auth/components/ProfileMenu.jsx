import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { logOut } from '../utils/firebase';

const ProfileMenu = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  const handleLogout = async () => {
    try {
      await logOut();
      // AuthContext will handle the rest
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  if (!user) return null;
  
  return (
    <div className="dropdown" ref={menuRef}>
      <button 
        onClick={toggleMenu}
        className="flex items-center space-x-2 focus:outline-none"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-500 text-white flex items-center justify-center">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || 'User'} 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-medium text-sm">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </span>
          )}
        </div>
        <span className="hidden md:block text-sm font-medium">
          {user.displayName || 'User'}
        </span>
      </button>
      
      {isOpen && (
        <div className="dropdown-menu">
          <div className="py-2">
            <div className="px-4 py-3 border-b border-light-500 dark:border-dark-500">
              <p className="text-sm font-medium text-dark-700 dark:text-light-100">
                {user.displayName || 'User'}
              </p>
              <p className="text-xs text-dark-500 dark:text-light-500 truncate">
                {user.email}
              </p>
            </div>
            
            <a
              href="/profile"
              className="dropdown-item"
            >
              Profile
            </a>
            
            <a
              href="/settings"
              className="dropdown-item"
            >
              Settings
            </a>
            
            <a
              href="/billing"
              className="dropdown-item"
            >
              Billing
            </a>
            
            <div className="border-t border-light-500 dark:border-dark-500 pt-1 mt-1">
              <button
                onClick={handleLogout}
                className="dropdown-item text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu; 
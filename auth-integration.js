// Firebase Authentication integration for VoiceCraft
import { auth, db, logOut } from './auth/utils/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// DOM Elements
const loginButton = document.createElement('button');
loginButton.className = 'auth-btn login-btn';
loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> <span>Sign In</span>';

const registerButton = document.createElement('button');
registerButton.className = 'auth-btn register-btn';
registerButton.innerHTML = '<i class="fas fa-user-plus"></i> <span>Sign Up</span>';

const userProfileMenu = document.createElement('div');
userProfileMenu.className = 'user-profile-menu';
userProfileMenu.innerHTML = `
  <button class="profile-btn">
    <div class="profile-avatar">
      <i class="fas fa-user"></i>
    </div>
    <span class="profile-name">User</span>
  </button>
  <div class="profile-dropdown">
    <div class="profile-info">
      <p class="profile-email"></p>
    </div>
    <a href="/profile" class="profile-link">Profile</a>
    <a href="/settings" class="profile-link">Settings</a>
    <a href="/billing" class="profile-link">Billing</a>
    <button class="logout-btn">Sign out</button>
  </div>
`;

// State
let currentUser = null;
let profileMenuVisible = false;

// Initialize auth state
function initAuth() {
  const headerActions = document.querySelector('.header-actions');
  
  // Add auth buttons to header
  headerActions.prepend(registerButton);
  headerActions.prepend(loginButton);
  headerActions.prepend(userProfileMenu);
  
  // Hide profile menu initially
  userProfileMenu.style.display = 'none';
  
  // Set up auth state listener
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Update user state
          currentUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || userData.displayName || 'User',
            photoURL: user.photoURL,
            onboardingComplete: !!userData.onboardingComplete,
            preferredVoice: userData.preferredVoice || 'en-us'
          };
          
          // Update UI for authenticated user
          updateUIForAuthenticatedUser();
          
          // If onboarding is not complete, redirect to onboarding
          if (!currentUser.onboardingComplete) {
            window.location.href = '/onboarding';
          }
          
          // Pre-select user's preferred voice if available
          if (currentUser.preferredVoice) {
            const voiceSelect = document.getElementById('voice-select');
            if (voiceSelect) {
              voiceSelect.value = currentUser.preferredVoice;
            }
          }
        }
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    } else {
      // Reset user state
      currentUser = null;
      
      // Update UI for unauthenticated user
      updateUIForUnauthenticatedUser();
    }
  });
  
  // Add event listeners
  loginButton.addEventListener('click', () => {
    window.location.href = '/login';
  });
  
  registerButton.addEventListener('click', () => {
    window.location.href = '/register';
  });
  
  const profileBtn = userProfileMenu.querySelector('.profile-btn');
  profileBtn.addEventListener('click', toggleProfileMenu);
  
  const logoutBtn = userProfileMenu.querySelector('.logout-btn');
  logoutBtn.addEventListener('click', handleLogout);
  
  // Close profile menu when clicking outside
  document.addEventListener('click', (event) => {
    if (profileMenuVisible && !userProfileMenu.contains(event.target)) {
      toggleProfileMenu();
    }
  });
}

// Update UI for authenticated user
function updateUIForAuthenticatedUser() {
  // Hide login/register buttons
  loginButton.style.display = 'none';
  registerButton.style.display = 'none';
  
  // Show profile menu
  userProfileMenu.style.display = 'block';
  
  // Update profile info
  const profileName = userProfileMenu.querySelector('.profile-name');
  const profileEmail = userProfileMenu.querySelector('.profile-email');
  const profileAvatar = userProfileMenu.querySelector('.profile-avatar');
  
  profileName.textContent = currentUser.displayName;
  profileEmail.textContent = currentUser.email;
  
  if (currentUser.photoURL) {
    profileAvatar.innerHTML = `<img src="${currentUser.photoURL}" alt="${currentUser.displayName}" />`;
  } else {
    profileAvatar.innerHTML = `<span>${currentUser.displayName.charAt(0).toUpperCase()}</span>`;
  }
}

// Update UI for unauthenticated user
function updateUIForUnauthenticatedUser() {
  // Show login/register buttons
  loginButton.style.display = 'block';
  registerButton.style.display = 'block';
  
  // Hide profile menu
  userProfileMenu.style.display = 'none';
  
  // Close profile dropdown if open
  const profileDropdown = userProfileMenu.querySelector('.profile-dropdown');
  profileDropdown.classList.remove('active');
  profileMenuVisible = false;
}

// Toggle profile dropdown menu
function toggleProfileMenu() {
  const profileDropdown = userProfileMenu.querySelector('.profile-dropdown');
  profileDropdown.classList.toggle('active');
  profileMenuVisible = !profileMenuVisible;
}

// Handle logout
async function handleLogout() {
  try {
    await logOut();
    // Auth state change will be handled by the listener
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

// Initialize auth when the DOM is loaded
document.addEventListener('DOMContentLoaded', initAuth);

// CSS for auth components
const authStyle = document.createElement('style');
authStyle.textContent = `
  .auth-btn {
    display: flex;
    align-items: center;
    margin-right: 10px;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .login-btn {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-color);
  }
  
  .login-btn:hover {
    background: var(--bg-hover);
  }
  
  .register-btn {
    background: var(--primary-color);
    border: none;
    color: white;
  }
  
  .register-btn:hover {
    background: var(--primary-dark);
  }
  
  .auth-btn i {
    margin-right: 6px;
  }
  
  .user-profile-menu {
    position: relative;
    margin-right: 10px;
  }
  
  .profile-btn {
    display: flex;
    align-items: center;
    background: transparent;
    border: none;
    padding: 5px;
    cursor: pointer;
    border-radius: 20px;
  }
  
  .profile-btn:hover {
    background: var(--bg-hover);
  }
  
  .profile-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--primary-color);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin-right: 8px;
  }
  
  .profile-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .profile-dropdown {
    position: absolute;
    top: 45px;
    right: 0;
    width: 220px;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    display: none;
  }
  
  .profile-dropdown.active {
    display: block;
  }
  
  .profile-info {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
  }
  
  .profile-email {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .profile-link {
    display: block;
    padding: 10px 16px;
    text-decoration: none;
    color: var(--text-color);
  }
  
  .profile-link:hover {
    background: var(--bg-hover);
  }
  
  .logout-btn {
    width: 100%;
    text-align: left;
    padding: 10px 16px;
    background: transparent;
    border: none;
    border-top: 1px solid var(--border-color);
    color: #e74c3c;
    cursor: pointer;
  }
  
  .logout-btn:hover {
    background: rgba(231, 76, 60, 0.1);
  }
  
  @media (max-width: 768px) {
    .auth-btn span {
      display: none;
    }
    
    .profile-name {
      display: none;
    }
  }
`;

document.head.appendChild(authStyle); 
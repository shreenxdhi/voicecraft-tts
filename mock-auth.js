// Mock authentication middleware for Express
// This file replaces the Firebase auth-middleware.js with a simple pass-through version

// Simple pass-through middleware for authentication
const requireAuth = (req, res, next) => {
  // Create a mock user object
  req.user = {
    uid: 'mock-user-123',
    email: 'user@example.com',
    onboardingComplete: true,
    displayName: 'Test User',
    preferredVoice: 'en-us'
  };
  
  // Continue to next middleware
  next();
};

// Simple pass-through middleware for onboarding check
const requireOnboarding = (req, res, next) => {
  // Always allow access
  next();
};

module.exports = { requireAuth, requireOnboarding }; 
// Authentication middleware for Express
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

// Middleware to verify authentication
const requireAuth = async (req, res, next) => {
  try {
    // Check if Authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get token from header
    const token = authHeader.split('Bearer ')[1];
    
    // Verify token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Add user ID to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };
    
    // Check if user has completed onboarding
    const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      req.user.onboardingComplete = !!userData.onboardingComplete;
      req.user.displayName = userData.displayName || '';
      req.user.preferredVoice = userData.preferredVoice || '';
    } else {
      req.user.onboardingComplete = false;
    }
    
    // Continue to next middleware
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

// Middleware to check if user has completed onboarding
const requireOnboarding = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (!req.user.onboardingComplete) {
    return res.status(403).json({ 
      error: 'Onboarding required',
      message: 'Please complete your profile setup' 
    });
  }
  
  next();
};

module.exports = { requireAuth, requireOnboarding }; 
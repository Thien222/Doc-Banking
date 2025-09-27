const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Google OAuth routes
router.get('/google', (req, res, next) => {
  console.log('🔐 [SSO] Starting Google OAuth flow');
  passport.authenticate('google', { 
    scope: ['profile', 'email', 'openid'],
    accessType: 'offline',
    prompt: 'consent'
  })(req, res, next);
});

router.get('/google/callback', 
  (req, res, next) => {
    console.log('🔐 [SSO] Google OAuth callback received');
    console.log('   Query params:', req.query);
    passport.authenticate('google', { 
      failureRedirect: '/login',
      failureFlash: true
    })(req, res, next);
  },
  (req, res) => {
    try {
      console.log('🔐 [SSO] Google authentication successful');
      console.log('   User:', req.user);
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: req.user._id, 
          username: req.user.username, 
          role: req.user.role,
          isSsoUser: req.user.isSsoUser 
        }, 
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('✅ [SSO] Google login successful for:', req.user.username);
      
      // Redirect to frontend with token
      const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:3001'}/auth-success?token=${token}&username=${req.user.username}&role=${req.user.role}`;
      console.log('   Redirecting to:', redirectUrl);
      res.redirect(redirectUrl);
      
    } catch (error) {
      console.error('❌ [SSO] Error generating JWT:', error);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3001'}/login?error=sso_failed`);
    }
  }
);

// SSO status check
router.get('/status', (req, res) => {
  console.log('🔐 [SSO] Status check requested');
  res.json({
    google: {
      enabled: !!process.env.GOOGLE_CLIENT_ID,
      clientId: process.env.GOOGLE_CLIENT_ID ? 'configured' : 'not_configured',
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/sso/google/callback'
    }
  });
});

// Logout SSO
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('❌ [SSO] Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error('❌ [SSO] Session destroy error:', err);
      }
      
      res.json({ message: 'Logged out successfully' });
    });
  });
});

module.exports = router; 
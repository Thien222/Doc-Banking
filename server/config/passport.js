const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Google OAuth Strategy - chỉ khởi tạo khi có credentials
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('🔐 [SSO] Initializing Google OAuth with:');
  console.log('   Client ID:', process.env.GOOGLE_CLIENT_ID);
  console.log('   Callback URL:', process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/sso/google/callback");
  
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/sso/google/callback",
      scope: ['profile', 'email', 'openid'], // Thêm openid scope
      passReqToCallback: true // Thêm để debug
    },
    async function(req, accessToken, refreshToken, profile, done) {
      try {
        console.log('🔐 [SSO] Google OAuth callback received');
        console.log('   Access Token:', accessToken ? 'Present' : 'Missing');
        console.log('   Refresh Token:', refreshToken ? 'Present' : 'Missing');
        console.log('   Profile ID:', profile.id);
        console.log('   Display Name:', profile.displayName);
        console.log('   Email:', profile.emails?.[0]?.value);
        
        // Tìm user theo Google ID
        let user = await User.findOne({ 
          ssoProvider: 'google', 
          ssoId: profile.id 
        });
        
        if (user) {
          // User đã tồn tại, cập nhật thông tin
          user.lastSsoLogin = new Date();
          user.ssoName = profile.displayName;
          user.ssoPicture = profile.photos[0]?.value;
          await user.save();
          
          console.log('✅ [SSO] Existing user found:', user.username);
          return done(null, user);
        }
        
        // Kiểm tra email đã tồn tại chưa
        const existingUserByEmail = await User.findOne({ email: profile.emails[0].value });
        if (existingUserByEmail) {
          // Link Google account với user hiện tại
          existingUserByEmail.ssoProvider = 'google';
          existingUserByEmail.ssoId = profile.id;
          existingUserByEmail.ssoEmail = profile.emails[0].value;
          existingUserByEmail.ssoName = profile.displayName;
          existingUserByEmail.ssoPicture = profile.photos[0]?.value;
          existingUserByEmail.lastSsoLogin = new Date();
          existingUserByEmail.isSsoUser = true;
          await existingUserByEmail.save();
          
          console.log('🔗 [SSO] Linked Google account to existing user:', existingUserByEmail.username);
          return done(null, existingUserByEmail);
        }
        
        // Tạo user mới từ Google
        const newUser = new User({
          username: profile.emails[0].value.split('@')[0], // Lấy phần trước @ làm username
          email: profile.emails[0].value,
          ssoProvider: 'google',
          ssoId: profile.id,
          ssoEmail: profile.emails[0].value,
          ssoName: profile.displayName,
          ssoPicture: profile.photos[0]?.value,
          lastSsoLogin: new Date(),
          isSsoUser: true,
          emailVerified: true, // Google đã verify email
          isActive: true, // Auto active cho SSO users
          role: 'khach-hang' // Default role
        });
        
        await newUser.save();
        console.log('🆕 [SSO] New user created from Google:', newUser.username);
        return done(null, newUser);
        
      } catch (error) {
        console.error('❌ [SSO] Google auth error:', error);
        return done(error, null);
      }
    }
  ));
  
  console.log('✅ [SSO] Google OAuth strategy initialized');
} else {
  console.log('⚠️ [SSO] Google OAuth credentials not found. SSO will be disabled.');
  console.log('   Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env file');
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport; 
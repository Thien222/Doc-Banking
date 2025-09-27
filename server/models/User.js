const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Optional - cho SSO users
  role: { type: String, enum: ['admin', 'khach-hang', 'quan-ly-khach-hang', 'quan-tri-tin-dung', 'ban-giam-doc', 'quan-ly-giao-dich'], default: null },
  isActive: { type: Boolean, default: false }, // Được admin duyệt/cấp role mới active
  createdAt: { type: Date, default: Date.now },
  email: { type: String, required: true, unique: true },
  emailVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  
  // SSO fields (chỉ tạo khi có SSO). Không đặt default: null để tránh duplicate key với unique index
  ssoProvider: { type: String, enum: ['google', 'microsoft', 'saml'] },
  ssoId: { type: String, sparse: true }, // ID từ SSO provider
  ssoEmail: { type: String }, // Email từ SSO provider
  ssoName: { type: String }, // Tên từ SSO provider
  ssoPicture: { type: String }, // Avatar từ SSO provider
  lastSsoLogin: { type: Date },
  isSsoUser: { type: Boolean, default: false }
});

// Index cho SSO lookup: chỉ index khi có cả ssoProvider & ssoId (tránh null,null)
UserSchema.index(
  { ssoProvider: 1, ssoId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      ssoProvider: { $exists: true, $ne: null },
      ssoId: { $exists: true, $ne: null }
    }
  }
);

module.exports = mongoose.model('User', UserSchema); 
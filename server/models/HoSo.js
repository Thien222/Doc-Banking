const mongoose = require('mongoose');

const HoSoSchema = new mongoose.Schema({
  soTaiKhoan: { 
    type: String, 
    required: [true, 'Số tài khoản là bắt buộc'],
    trim: true
  },
  cif: { 
    type: String, 
    trim: true
  },
  tenKhachHang: { 
    type: String, 
    required: [true, 'Tên khách hàng là bắt buộc'],
    trim: true
  },
  soTienGiaiNgan: { 
    type: Number,
    min: [0, 'Số tiền giải ngân phải lớn hơn 0']
  },
  loaiTien: { 
    type: String,
    trim: true
  },
  // SỬA: Xử lý ngayGiaiNgan với validation tốt hơn
  ngayGiaiNgan: { 
    type: Date,
    validate: {
      validator: function(value) {
        // Cho phép null hoặc undefined
        if (value == null) return true;
        // Kiểm tra Date hợp lệ
        return value instanceof Date && !isNaN(value.getTime());
      },
      message: 'Ngày giải ngân không hợp lệ'
    },
    // Custom setter để handle string dates
    set: function(value) {
      if (value == null || value === '') return null;
      if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
      }
      if (typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
      }
      return null;
    }
  },
  trangThai: { 
    type: String, 
    enum: [
      'moi', 
      'dang-xu-ly', 
      'qttd-da-nhan',
      'qttd-tu-choi',
      'qttd-hoan-tra',
      'hoan-tat',
      'hoan-thanh'
    ],
    default: 'moi'
  },
  phong: { 
    type: String,
    trim: true
  },
  qlkh: { 
    type: String,
    trim: true
  },
  hopDong: { 
    type: String,
    trim: true
  },
  hosoLienQuan: {
    deXuat: { type: Boolean, default: false },
    hopDong: { type: Boolean, default: false },
    unc: { type: Boolean, default: false },
    hoaDon: { type: Boolean, default: false },
    bienBan: { type: Boolean, default: false },
    khac: { type: String, trim: true, default: '' }
  },
  
  // Thêm các fields để track rejection reasons
  bgdTuChoi: {
    lyDo: { type: String, trim: true },
    ngayTuChoi: { type: Date },
    nguoiTuChoi: { type: String, trim: true }
  },
  qttdTuChoi: {
    lyDo: { type: String, trim: true },
    ngayTuChoi: { type: Date },
    nguoiTuChoi: { type: String, trim: true }
  },
  
  // Metadata
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  createdBy: { 
    type: String,
    trim: true
  },
  updatedBy: { 
    type: String,
    trim: true
  }
}, {
  // SỬA: Thêm options để handle JSON serialization
  toJSON: {
    transform: function(doc, ret) {
      // Format dates for frontend
      if (ret.ngayGiaiNgan) {
        ret.ngayGiaiNgan = ret.ngayGiaiNgan.toISOString();
      }
      if (ret.createdAt) {
        ret.createdAt = ret.createdAt.toISOString();
      }
      if (ret.updatedAt) {
        ret.updatedAt = ret.updatedAt.toISOString();
      }
      return ret;
    }
  },
  timestamps: true // Auto manage createdAt and updatedAt
});

// SỬA: Middleware để update updatedAt
HoSoSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

HoSoSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// SỬA: Static method để clean invalid dates trong database
HoSoSchema.statics.cleanInvalidDates = async function() {
  try {
    console.log('🧹 [HOSO] Starting cleanup of invalid dates...');
    
    // Find documents with invalid dates
    const docs = await this.find({
      ngayGiaiNgan: { $exists: true, $ne: null }
    }).lean();
    
    let cleanedCount = 0;
    
    for (const doc of docs) {
      if (doc.ngayGiaiNgan && isNaN(new Date(doc.ngayGiaiNgan).getTime())) {
        await this.findByIdAndUpdate(doc._id, {
          $unset: { ngayGiaiNgan: 1 }
        });
        cleanedCount++;
        console.log(`🧹 [HOSO] Cleaned invalid date for document ${doc._id}`);
      }
    }
    
    console.log(`✅ [HOSO] Cleanup completed. Cleaned ${cleanedCount} documents.`);
    return cleanedCount;
    
  } catch (error) {
    console.error('❌ [HOSO] Error during cleanup:', error);
    throw error;
  }
};

// Indexes for better performance
HoSoSchema.index({ soTaiKhoan: 1 });
HoSoSchema.index({ tenKhachHang: 1 });
HoSoSchema.index({ trangThai: 1 });
HoSoSchema.index({ ngayGiaiNgan: 1 });
HoSoSchema.index({ createdAt: -1 });
HoSoSchema.index({ phong: 1, qlkh: 1 });

module.exports = mongoose.model('HoSo', HoSoSchema);
const mongoose = require('mongoose');

const HoSoSchema = new mongoose.Schema({
  soTaiKhoan: { type: String, required: true },
  cif: { type: String },
  tenKhachHang: { type: String, required: true },
  soTienGiaiNgan: { type: Number },
  loaiTien: { type: String },
  ngayGiaiNgan: { type: Date },
  trangThai: { type: String, default: 'moi' },
  phong: { type: String },
  qlkh: { type: String },
  hopDong: { type: String },
  ghiChu: { type: String },
  hosoLienQuan: {
    deXuat: { type: Boolean, default: false },
    hopDong: { type: Boolean, default: false },
    unc: { type: Boolean, default: false },
    hoaDon: { type: Boolean, default: false },
    bienBan: { type: Boolean, default: false },
    khac: { type: String, default: '' }
  },
  // Các thao tác nghiệp vụ
  banGiao: {
    daBanGiao: { type: Boolean, default: false },
    user: { type: String },
    ghiChu: { type: String }
  },
  nhanGiao: {
    daNhan: { type: Boolean, default: false },
    user: { type: String },
    ghiChu: { type: String }
  },
  hoanTra: {
    daHoanTra: { type: Boolean, default: false },
    user: { type: String },
    ghiChu: { type: String }
  },
  nhanChungTu: {
    daNhan: { type: Boolean, default: false },
    user: { type: String },
    ghiChu: { type: String }
  },
  // BGD từ chối
  bgdTuChoi: {
    daTuChoi: { type: Boolean, default: false },
    user: { type: String },
    lyDo: { type: String }
  },
  // QTTD từ chối
  qttdTuChoi: {
    daTuChoi: { type: Boolean, default: false },
    user: { type: String },
    lyDo: { type: String }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HoSo', HoSoSchema); 
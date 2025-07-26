import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import Notification from './components/Notification';
import SessionManager from './utils/sessionManager';
import { io } from 'socket.io-client';
import DigitalSignature from './components/DigitalSignature';

export default function BGDPage() {
  const [hosoList, setHosoList] = useState([]);
  const [selectedHoso, setSelectedHoso] = useState(null);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [msg, setMsg] = useState('');
  // Thêm state cho popup xác nhận đủ hồ sơ vật lý
  const [showDetail, setShowDetail] = useState(false);
  const [hosoChecklist, setHosoChecklist] = useState({ deXuat: false, hopDong: false, unc: false, hoaDon: false, bienBan: false, khac: '' });
  const [socket, setSocket] = useState(null);
  const [showSignature, setShowSignature] = useState(false);
  const [signatureData, setSignatureData] = useState(null);

  // Lấy danh sách hồ sơ trạng thái 'moi'
  const fetchHoso = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/hoso`, {
      params: { trangThai: 'moi' }
    });
    setHosoList(res.data.data || []);
  };

  useEffect(() => { 
    // Khôi phục session nếu cần
    SessionManager.restoreSession();
    SessionManager.refreshSession();
    
    fetchHoso(); 
    
    // Kết nối Socket.IO để nhận notification và refresh dữ liệu
    const newSocket = io(process.env.REACT_APP_API_URL);
    setSocket(newSocket);
    
    const role = localStorage.getItem('role');
    if (role) {
      newSocket.emit('join-room', role);
    }
    
    // Lắng nghe notification và refresh dữ liệu ngay lập tức
    newSocket.on('notification', (notification) => {
      console.log('🔔 Received notification, refreshing data...', notification);
      fetchHoso(); // Refresh dữ liệu ngay khi nhận notification
    });
    
    // Auto refresh mỗi 30 giây
    const interval = setInterval(() => {
      fetchHoso();
    }, 30000);
    
    return () => {
      if (role) {
        newSocket.emit('leave-room', role);
      }
      newSocket.close();
      clearInterval(interval);
    };
  }, []);

  // Bàn giao hồ sơ
  const handleBanGiao = async (hoso) => {
            await axios.put(`${process.env.REACT_APP_API_URL}/hoso/${hoso._id}/ban-giao`, { user: 'BGD' });
    setMsg('Đã bàn giao hồ sơ!');
    fetchHoso();
  };

  // Từ chối hồ sơ
  const handleReject = async () => {
    if (!rejectReason.trim()) return setMsg('Vui lòng nhập lý do từ chối!');
            await axios.post(`${process.env.REACT_APP_API_URL}/hoso/${selectedHoso._id}/bgd-tu-choi`, { user: 'BGD', lyDo: rejectReason });
    setMsg('Đã từ chối hồ sơ!');
    setShowReject(false);
    setRejectReason('');
    fetchHoso();
  };

  // Khi chọn hồ sơ, mở popup và load checklist từ hosoLienQuan (nếu có)
  const handleShowDetail = (hoso) => {
    setSelectedHoso(hoso);
    setHosoChecklist({
      deXuat: !!(hoso.hosoLienQuan?.deXuat),
      hopDong: !!(hoso.hosoLienQuan?.hopDong),
      unc: !!(hoso.hosoLienQuan?.unc),
      hoaDon: !!(hoso.hosoLienQuan?.hoaDon),
      bienBan: !!(hoso.hosoLienQuan?.bienBan),
      khac: hoso.hosoLienQuan?.khac || ''
    });
    setShowDetail(true);
  };

  // Lưu xác nhận checklist vào localStorage theo từng hồ sơ
  const saveChecklist = (hosoId, checklist) => {
    const all = JSON.parse(localStorage.getItem('hosoChecklistBGD') || '{}');
    all[hosoId] = checklist;
    localStorage.setItem('hosoChecklistBGD', JSON.stringify(all));
  };
  // Lấy checklist đã lưu
  const getChecklist = (hosoId) => {
    const all = JSON.parse(localStorage.getItem('hosoChecklistBGD') || '{}');
    return all[hosoId] || null;
  };
  // Kiểm tra đã tick đủ chưa (trừ trường 'khac')
  const isChecklistFull = (checklist) => checklist && checklist.deXuat && checklist.hopDong && checklist.unc && checklist.hoaDon && checklist.bienBan;

  const handleLogout = () => {
    SessionManager.clearSession();
    window.location.href = '/login';
  };

  const handleSignatureSave = (signatureInfo) => {
    setSignatureData(signatureInfo);
    setShowSignature(false);
    console.log('Chữ ký đã được lưu:', signatureInfo);
  };

  // Hàm sinh PDF xác nhận bàn giao
  const generatePDF = (hoso, checklist) => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'normal');
    
    // Thêm logo BIDV
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 139); // Màu xanh navy
    doc.text('BIDV', 18, 18);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Bank for Investment and Development of Vietnam', 18, 22);
    doc.setTextColor(0, 0, 0); // Reset về màu đen
    
    // Tiêu đề chính
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('BIEN BAN BAN GIAO HO SO GIAI NGAN', 105, 35, { align: 'center' });
    
    // Đường kẻ phân cách
    doc.setDrawColor(0, 0, 139);
    doc.setLineWidth(0.5);
    doc.line(18, 40, 192, 40);
    
    // Thông tin cơ bản
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    let y = 50;
    
    doc.setFont('helvetica', 'bold');
    doc.text('I. THONG TIN KHACH HANG:', 18, y);
    doc.setFont('helvetica', 'normal');
    y += 8;
    doc.text(`• Ten khach hang: ${hoso.tenKhachHang || 'N/A'}`, 22, y);
    y += 6;
    doc.text(`• So tai khoan: ${hoso.soTaiKhoan || 'N/A'}`, 22, y);
    y += 6;
    doc.text(`• So tien giai ngan: ${hoso.soTienGiaiNgan ? hoso.soTienGiaiNgan.toLocaleString('vi-VN') + ' VND' : 'N/A'}`, 22, y);
    y += 6;
    doc.text(`• Ngay giai ngan: ${hoso.ngayGiaiNgan ? new Date(hoso.ngayGiaiNgan).toLocaleDateString('vi-VN') : 'N/A'}`, 22, y);
    y += 6;
    doc.text(`• Phong ban: ${hoso.phong || 'N/A'}`, 22, y);
    y += 6;
    doc.text(`• QLKH phu trach: ${hoso.qlkh || 'N/A'}`, 22, y);
    
    // Danh sách hồ sơ
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('II. DANH SACH HO SO DA BAN GIAO:', 18, y);
    doc.setFont('helvetica', 'normal');
    y += 8;
    
    const documents = [];
    if (checklist.deXuat) documents.push('De xuat giai ngan/Bao lanh');
    if (checklist.hopDong) documents.push('Hop dong tin dung/De nghi BL');
    if (checklist.unc) documents.push('Uy nhiem chi (UNC)');
    if (checklist.hoaDon) documents.push('Hoa don giai ngan');
    if (checklist.bienBan) documents.push('Bien ban ban giao tai san');
    if (checklist.khac) documents.push(`Khac: ${checklist.khac}`);
    
    documents.forEach((document, index) => {
      doc.text(`• ${document}`, 22, y);
      y += 6;
    });
    
    // Thông tin bàn giao
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('III. THONG TIN BAN GIAO:', 18, y);
    doc.setFont('helvetica', 'normal');
    y += 8;
    doc.text(`• Ben ban giao: Ban Giam doc (BGD)`, 22, y);
    y += 6;
    doc.text(`• Ben nhan: Quan tri Tin dung (QTTD)`, 22, y);
    y += 6;
    doc.text(`• Ngay lap bien ban: ${new Date().toLocaleDateString('vi-VN')}`, 22, y);
    y += 6;
    doc.text(`• Thoi gian: ${new Date().toLocaleTimeString('vi-VN')}`, 22, y);
    
    // Chữ ký
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('IV. CHU KY CAC BEN:', 18, y);
    
    // Đường kẻ nhỏ phân cách
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(18, y + 3, 192, y + 3);
    
    y += 20;
    
    // Thêm chữ ký số vào PDF nếu có
    if (signatureData) {
      try {
        // Thêm chữ ký BGD
        doc.addImage(signatureData.data, 'PNG', 18, y - 15, 40, 20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Ban Giam doc', 25, y + 15);
        
        // Thêm thông tin chữ ký
       
      } catch (error) {
        console.error('Lỗi khi thêm chữ ký vào PDF:', error);
        doc.setFontSize(10);
        doc.text('Ban Giam doc: ....................', 18, y);
        doc.text('(Ky, ghi ro ho ten)', 18, y + 8);
      }
    } else {
      doc.setFontSize(10);
      doc.text('Ban Giam doc: ....................', 18, y);
      doc.text('(Ky, ghi ro ho ten)', 18, y + 8);
    }
    
    doc.save(`BienBanBanGiao_${hoso.soTaiKhoan || ''}.pdf`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(120deg, #7f53ac 0%, #647dee 50%, #fc5c7d 100%)',
      fontFamily: 'Montserrat, Segoe UI, Arial, sans-serif',
      padding: '48px 0 32px 0',
      color: '#2d3748',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        background: 'rgba(255,255,255,0.92)',
        borderRadius: 22,
        boxShadow: '0 8px 32px rgba(127,83,172,0.18), 0 2px 8px rgba(100,125,222,0.10)',
        padding: '40px 32px',
        border: '1px solid #e0eafc'
      }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32}}>
          <h2 style={{color:'#7f53ac', fontWeight:800, fontSize:'2rem', letterSpacing:1, margin:0}}>Hồ sơ QLKH bàn giao</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={() => setShowSignature(true)}
              style={{
                background: 'var(--magnetic-card-bg)',
                border: '2px solid var(--border-color)',
                borderRadius: '50px',
                padding: '12px 20px',
                cursor: 'pointer',
                boxShadow: 'var(--magnetic-shadow)',
                transition: 'all 0.3s ease',
                fontSize: '1rem',
                color: 'var(--text-primary)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'scale(1.1)';
                e.target.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'var(--magnetic-shadow)';
              }}
            >
              ✍️ Chữ ký
            </button>
            <button 
              onClick={handleLogout}
              style={{
                background: 'var(--magnetic-card-bg)',
                border: '2px solid var(--border-color)',
                borderRadius: '50px',
                padding: '12px 20px',
                cursor: 'pointer',
                boxShadow: 'var(--magnetic-shadow)',
                transition: 'all 0.3s ease',
                fontSize: '1rem',
                color: 'var(--text-primary)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'scale(1.1)';
                e.target.style.boxShadow = '0 12px 40px rgba(239, 68, 68, 0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'var(--magnetic-shadow)';
              }}
            >
              🚪 Đăng xuất
            </button>
          </div>
        </div>
        <div className="responsive-table-wrapper">
          <table className="responsive-table">
            <thead>
              <tr className="responsive-table-header">
                <th className="responsive-table-cell">STT</th>
                <th className="responsive-table-cell">Số tài khoản</th>
                <th className="responsive-table-cell">Khách hàng</th>
                <th className="responsive-table-cell">Phòng</th>
                <th className="responsive-table-cell">QLKH</th>
                <th className="responsive-table-cell">Ghi chú</th>
                <th className="responsive-table-cell">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {hosoList.length === 0 && <tr><td colSpan={7} style={{textAlign:'center', padding:32, color:'#888'}}>Không có hồ sơ mới</td></tr>}
              {hosoList.map((h, idx) => (
                <tr key={h._id} className="responsive-table-row">
                  <td className="responsive-table-cell">{idx+1}</td>
                  <td className="responsive-table-cell">{h.soTaiKhoan}</td>
                  <td className="responsive-table-cell">{h.tenKhachHang}</td>
                  <td className="responsive-table-cell">{h.phong}</td>
                  <td className="responsive-table-cell">{h.qlkh}</td>
                  <td className="responsive-table-cell">{h.ghiChu}</td>
                  <td className="responsive-table-cell">
                    <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap: '10px', minWidth: 120}}>
                      <button
                        className="responsive-btn"
                        onClick={()=>{
                          const checklist = getChecklist(h._id);
                          if (isChecklistFull(checklist)) {
                            generatePDF(h, checklist);
                            handleBanGiao(h);
                          }
                        }}
                        disabled={!isChecklistFull(getChecklist(h._id))}
                      >Bàn giao</button>
                      <button className="responsive-btn" style={{background:'linear-gradient(135deg, #e53e3e 0%, #fc5c7d 100%)', color:'#fff', border:'none', borderRadius:12, padding:'10px 0', fontWeight:700, fontSize:'1rem', boxShadow:'0 2px 8px rgba(229,62,62,0.10)', cursor:'pointer', transition:'all 0.2s'}} onClick={()=>{setSelectedHoso(h); setShowReject(true);}}>Từ chối</button>
                      <button className="responsive-btn" style={{background:'#fff', color:'#7f53ac', border:'1.5px solid #a855f7', borderRadius:12, padding:'10px 0', fontWeight:700, fontSize:'1rem', cursor:'pointer'}} onClick={()=>handleShowDetail(h)}>Chi tiết</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {msg && <p style={{color:'#e53e3e',textAlign:'center',marginTop:18, fontWeight:600}}>{msg}</p>}
      </div>
      {/* Popup từ chối */}
      {showReject && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{color:'#e53e3e',marginBottom:16, textAlign:'center', fontWeight:800}}>Lý do từ chối</h3>
            <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} rows={3} style={{width:'100%',borderRadius:12,padding:12,border:'2px solid #e0eafc',marginBottom:18, fontSize:'1.08rem', fontFamily:'Montserrat'}} placeholder="Nhập lý do từ chối..."/>
            <div style={{display:'flex',gap:14,justifyContent:'center'}}>
              <button onClick={()=>{setShowReject(false);setRejectReason('');}} className="responsive-btn">Hủy</button>
              <button onClick={handleReject} className="responsive-btn" style={{background:'linear-gradient(135deg, #e53e3e 0%, #fc5c7d 100%)',color:'#fff',border:'none',borderRadius:12,padding:'10px 24px',fontWeight:700,fontSize:'1rem',cursor:'pointer'}}>Từ chối</button>
            </div>
          </div>
        </div>
      )}
      {/* Popup xác nhận đủ hồ sơ vật lý */}
      {showDetail && selectedHoso && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{color:'#7f53ac',marginBottom:22, textAlign:'center', fontWeight:800, fontSize: '1.35rem', letterSpacing:0.5}}>Xác nhận đủ hồ sơ vật lý</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'18px 32px',marginBottom:24, width:'100%'}}>
              <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600}}><input type="checkbox" checked={hosoChecklist.deXuat} onChange={e=>setHosoChecklist(c=>({...c,deXuat:e.target.checked}))}/> Đề xuất</label>
              <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600}}><input type="checkbox" checked={hosoChecklist.hopDong} onChange={e=>setHosoChecklist(c=>({...c,hopDong:e.target.checked}))}/> HĐTD/ĐN BL</label>
              <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600}}><input type="checkbox" checked={hosoChecklist.unc} onChange={e=>setHosoChecklist(c=>({...c,unc:e.target.checked}))}/> UNC</label>
              <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600}}><input type="checkbox" checked={hosoChecklist.hoaDon} onChange={e=>setHosoChecklist(c=>({...c,hoaDon:e.target.checked}))}/> HĐ giải ngân</label>
              <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600}}><input type="checkbox" checked={hosoChecklist.bienBan} onChange={e=>setHosoChecklist(c=>({...c,bienBan:e.target.checked}))}/> Biên bản</label>
              <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600}}>
                Khác: <input type="text" value={hosoChecklist.khac} onChange={e=>setHosoChecklist(c=>({...c,khac:e.target.value}))} style={{width:90, borderRadius:6, border:'1px solid #ccc', padding:'2px 6px', fontSize:14}}/>
              </label>
            </div>
            <div style={{display:'flex',gap:18,justifyContent:'center',marginTop:8, width:'100%'}}>
              <button onClick={()=>setShowDetail(false)} className="responsive-btn">Đóng</button>
              <button onClick={()=>{saveChecklist(selectedHoso._id, hosoChecklist);setShowDetail(false);setMsg('Đã lưu xác nhận!');}} className="responsive-btn" style={{background:'linear-gradient(90deg, #a855f7 0%, #fc5c7d 100%)',color:'#fff',border:'none',borderRadius:12,padding:'10px 32px',fontWeight:800,fontSize:'1.08rem',cursor:'pointer', boxShadow:'0 2px 8px #a855f733'}}>Lưu xác nhận</button>
            </div>
          </div>
        </div>
      )}
      <Notification />
      
      {/* Digital Signature Component */}
      {showSignature && (
        <DigitalSignature
          onSave={handleSignatureSave}
          onCancel={() => setShowSignature(false)}
          title="Chữ ký số - BGD"
        />
      )}
    </div>
  );
} 
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function BGDPage() {
  const [hosoList, setHosoList] = useState([]);
  const [selectedHoso, setSelectedHoso] = useState(null);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [msg, setMsg] = useState('');

  // Lấy danh sách hồ sơ trạng thái 'moi'
  const fetchHoso = async () => {
    const res = await axios.get('http://localhost:3000/hoso', {
      params: { trangThai: 'moi' }
    });
    setHosoList(res.data.data || []);
  };

  useEffect(() => { fetchHoso(); }, []);

  // Bàn giao hồ sơ
  const handleBanGiao = async (hoso) => {
    await axios.put(`http://localhost:3000/hoso/${hoso._id}/ban-giao`, { user: 'BGD' });
    setMsg('Đã bàn giao hồ sơ!');
    fetchHoso();
  };

  // Từ chối hồ sơ
  const handleReject = async () => {
    if (!rejectReason.trim()) return setMsg('Vui lòng nhập lý do từ chối!');
    await axios.put(`http://localhost:3000/hoso/${selectedHoso._id}/tu-choi`, { user: 'BGD', lyDo: rejectReason });
    setMsg('Đã từ chối hồ sơ!');
    setShowReject(false);
    setRejectReason('');
    fetchHoso();
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
        <h2 style={{textAlign:'center', color:'#7f53ac', fontWeight:800, fontSize:'2rem', letterSpacing:1, marginBottom:32}}>Hồ sơ QLKH bàn giao</h2>
        <table style={{width:'100%', background:'rgba(255,255,255,0.98)', borderRadius:16, boxShadow:'0 2px 12px #ccc', marginTop:8, borderCollapse:'separate', borderSpacing:'0 12px', fontSize:'1.08rem'}}>
          <thead>
            <tr style={{background:'#f7faff'}}>
              <th style={{padding:'14px 18px', borderRadius:'16px 0 0 16px', color:'#7f53ac', fontWeight:800, fontSize:'1.12rem'}}>STT</th>
              <th style={{padding:'14px 18px', color:'#7f53ac', fontWeight:800}}>Số tài khoản</th>
              <th style={{padding:'14px 18px', color:'#7f53ac', fontWeight:800}}>Khách hàng</th>
              <th style={{padding:'14px 18px', color:'#7f53ac', fontWeight:800}}>Phòng</th>
              <th style={{padding:'14px 18px', color:'#7f53ac', fontWeight:800}}>QLKH</th>
              <th style={{padding:'14px 18px', color:'#7f53ac', fontWeight:800}}>Ghi chú</th>
              <th style={{padding:'14px 18px', borderRadius:'0 16px 16px 0', color:'#7f53ac', fontWeight:800}}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {hosoList.length === 0 && <tr><td colSpan={7} style={{textAlign:'center', padding:32, color:'#888'}}>Không có hồ sơ mới</td></tr>}
            {hosoList.map((h, idx) => (
              <tr key={h._id} style={{background:'#fff', borderRadius:16}}>
                <td style={{padding:'14px 18px', borderRadius:'16px 0 0 16px', fontWeight:700}}>{idx+1}</td>
                <td style={{padding:'14px 18px'}}>{h.soTaiKhoan}</td>
                <td style={{padding:'14px 18px'}}>{h.tenKhachHang}</td>
                <td style={{padding:'14px 18px'}}>{h.phong}</td>
                <td style={{padding:'14px 18px'}}>{h.qlkh}</td>
                <td style={{padding:'14px 18px'}}>{h.ghiChu}</td>
                <td style={{padding:'14px 18px', borderRadius:'0 16px 16px 0'}}>
                  <button style={{marginRight:8, background:'linear-gradient(135deg, #7f53ac 0%, #fc5c7d 100%)', color:'#fff', border:'none', borderRadius:12, padding:'10px 20px', fontWeight:700, fontSize:'1rem', boxShadow:'0 2px 8px rgba(127,83,172,0.10)', cursor:'pointer', transition:'all 0.2s'}} onClick={()=>handleBanGiao(h)}>Bàn giao</button>
                  <button style={{background:'linear-gradient(135deg, #e53e3e 0%, #fc5c7d 100%)', color:'#fff', border:'none', borderRadius:12, padding:'10px 20px', fontWeight:700, fontSize:'1rem', boxShadow:'0 2px 8px rgba(229,62,62,0.10)', cursor:'pointer', transition:'all 0.2s'}} onClick={()=>{setSelectedHoso(h); setShowReject(true);}}>Từ chối</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {msg && <p style={{color:'#e53e3e',textAlign:'center',marginTop:18, fontWeight:600}}>{msg}</p>}
      </div>
      {/* Popup từ chối */}
      {showReject && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(127,83,172,0.13)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(2.5px)'}}>
          <div style={{background:'rgba(255,255,255,0.98)',padding:32,borderRadius:18,minWidth:320,boxShadow:'0 2px 16px #aaa', border:'1px solid #e0eafc', fontFamily:'Montserrat'}}>
            <h3 style={{color:'#e53e3e',marginBottom:16, textAlign:'center', fontWeight:800}}>Lý do từ chối</h3>
            <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} rows={3} style={{width:'100%',borderRadius:12,padding:12,border:'2px solid #e0eafc',marginBottom:18, fontSize:'1.08rem', fontFamily:'Montserrat'}} placeholder="Nhập lý do từ chối..."/>
            <div style={{display:'flex',gap:14,justifyContent:'center'}}>
              <button onClick={()=>{setShowReject(false);setRejectReason('');}} style={{background:'#f7faff',color:'#7f53ac',border:'1px solid #e0eafc',borderRadius:12,padding:'10px 24px',fontWeight:700,fontSize:'1rem',cursor:'pointer'}}>Hủy</button>
              <button onClick={handleReject} style={{background:'linear-gradient(135deg, #e53e3e 0%, #fc5c7d 100%)',color:'#fff',border:'none',borderRadius:12,padding:'10px 24px',fontWeight:700,fontSize:'1rem',cursor:'pointer'}}>Từ chối</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
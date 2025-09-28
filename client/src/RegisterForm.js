import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './AuthForm.css';
import { firebaseAuth } from './utils/firebase';
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

export default function RegisterForm() {
  const [form, setForm] = useState({ username: '', password: '', email: '' });
  const [msg, setMsg] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [useFirebase, setUseFirebase] = useState(true); // SỬA: Thêm flag để control
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    
    // SỬA: Thử Firebase trước, nếu fail thì dùng traditional register
    if (useFirebase) {
      try {
        console.log('🔥 Trying Firebase Email Link...');
        const actionCodeSettings = {
          url: window.location.origin + '/auth-success',
          handleCodeInApp: true,
        };
        
        await sendSignInLinkToEmail(firebaseAuth, form.email, actionCodeSettings);
        
        // Lưu email và username để dùng khi hoàn tất đăng ký
        window.localStorage.setItem('emailForSignIn', form.email);
        window.localStorage.setItem('usernameForSignIn', form.username);
        
        setEmailSent(true);
        setMsg('📧 Đã gửi liên kết đăng ký đến email của bạn. Vui lòng kiểm tra email!');
        return;
      } catch (firebaseErr) {
        console.error('🔥 Firebase Email Link Error:', firebaseErr);
        
        // SỬA: Kiểm tra các lỗi Firebase và fallback
        if (
          firebaseErr.code === 'auth/quota-exceeded' ||
          firebaseErr.code === 'auth/too-many-requests' ||
          firebaseErr.message.includes('quota') ||
          firebaseErr.message.includes('Exceeded daily quota')
        ) {
          console.log('⚠️ Firebase quota exceeded, falling back to traditional register');
          setMsg('⚠️ Firebase đã hết quota hôm nay, chuyển sang đăng ký truyền thống...');
          setUseFirebase(false); // Disable Firebase cho session này
          
          // Tự động thử traditional register sau 1 giây
          setTimeout(() => {
            handleTraditionalRegister();
          }, 1000);
          return;
        } else {
          // Các lỗi Firebase khác cũng fallback
          console.log('🔄 Firebase error, trying traditional register:', firebaseErr.message);
          setUseFirebase(false);
          setTimeout(() => {
            handleTraditionalRegister();
          }, 500);
          return;
        }
      }
    } else {
      // Nếu đã disable Firebase, dùng traditional luôn
      await handleTraditionalRegister();
    }
  };

  // SỬA: Tách riêng hàm traditional register
  const handleTraditionalRegister = async () => {
    try {
      console.log('🔄 Using traditional register...');
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isLocal ? 'http://localhost:3001' : '';
      
      const response = await axios.post(`${baseUrl}/auth/register`, form);
      
      setMsg('✅ Đăng ký thành công! Tài khoản đã được tạo và chờ admin duyệt. Vui lòng đăng nhập.');
      setEmailSent(false); // Không cần check email
      
      // Redirect về login sau 3 giây
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (traditionalErr) {
      console.error('❌ Traditional register error:', traditionalErr);
      setMsg(traditionalErr.response?.data?.error || 'Lỗi đăng ký: ' + traditionalErr.message);
    }
  };

  useEffect(() => {
    const tryCompleteSignIn = async () => {
      if (isSignInWithEmailLink(firebaseAuth, window.location.href)) {
        try {
          let email = window.localStorage.getItem('emailForSignIn');
          let username = window.localStorage.getItem('usernameForSignIn');
          
          if (!email) {
            email = window.prompt('Nhập email đã dùng để đăng ký:');
          }
          if (!username) {
            username = window.prompt('Nhập username đã dùng để đăng ký:') || email.split('@')[0];
          }
          
          const cred = await signInWithEmailLink(firebaseAuth, email, window.location.href);
          const idToken = await cred.user.getIdToken();
          
          // Gọi backend để tạo user nội bộ và nhận JWT
          const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const baseUrl = isLocal ? 'http://localhost:3001' : '';
          const resp = await axios.post(`${baseUrl}/auth/firebase-register`, {
            email,
            username,
            firebaseIdToken: idToken,
          });
          
          // Clear temporary storage
          window.localStorage.removeItem('emailForSignIn');
          window.localStorage.removeItem('usernameForSignIn');
          
          // SỬA: Kiểm tra nếu cần chờ duyệt
          if (resp.data.needsApproval) {
            setMsg('✅ ' + resp.data.message + ' Bạn có thể thử đăng nhập sau khi admin duyệt.');
            setEmailSent(false);
            
            // Redirect về login sau 4 giây
            setTimeout(() => {
              navigate('/login');
            }, 4000);
            return;
          }
          
          // Nếu không cần chờ duyệt, đăng nhập bình thường
          localStorage.setItem('token', resp.data.token);
          localStorage.setItem('role', resp.data.user?.role || 'khach-hang');
          localStorage.setItem('username', resp.data.user?.username || username);
          
          // Redirect based on role
          const role = resp.data.user?.role || 'khach-hang';
          if (role === 'admin') {
            window.location.href = '/admin';
          } else if (role === 'ban-giam-doc') {
            window.location.href = '/bgd';
          } else if (role === 'quan-tri-tin-dung') {
            window.location.href = '/qttd-nhan-ban-giao';
          } else if (role === 'quan-ly-khach-hang') {
            window.location.href = '/customer-manager';
          } else {
            window.location.href = '/';
          }
        } catch (error) {
          console.error('Firebase auth completion error:', error);
          setMsg('❌ ' + (error.response?.data?.error || 'Không thể hoàn tất xác thực từ email link'));
          setEmailSent(false);
        }
      }
    };
    tryCompleteSignIn();
  }, [navigate]);

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Đăng ký tài khoản</h2>
        {!emailSent ? (
          <>
            <input name="username" placeholder="Tên đăng nhập" value={form.username} onChange={handleChange} required />
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <input name="password" type="password" placeholder="Mật khẩu" value={form.password} onChange={handleChange} required />
            <button type="submit">
              {useFirebase ? '🔥 Đăng ký (Firebase)' : '📝 Đăng ký truyền thống'}
            </button>
            
            {/* SỬA: Thêm button để user có thể chọn traditional register */}
            {useFirebase && (
              <button type="button" 
                onClick={() => setUseFirebase(false)} 
                style={{
                  background: 'transparent', 
                  color: '#666', 
                  border: '1px solid #ddd',
                  marginTop: '10px',
                  fontSize: '0.9em'
                }}
              >
                📝 Hoặc đăng ký truyền thống (không cần email)
              </button>
            )}
            
            <p className="auth-link">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
          </>
        ) : (
          <>
            <h3 style={{textAlign:'center',color:'#6a82fb'}}>📧 Kiểm tra email để xác thực bằng liên kết</h3>
            <p>Hãy mở email và bấm vào liên kết đăng nhập. Trang sẽ tự hoàn tất khi bạn quay lại từ link.</p>
            <button type="button" 
              onClick={() => {
                setEmailSent(false);
                setUseFirebase(false);
                setMsg('Chuyển sang đăng ký truyền thống...');
              }}
              style={{
                background: '#f0f0f0', 
                color: '#666',
                border: '1px solid #ddd',
                marginTop: '15px'
              }}
            >
              🔄 Hoặc đăng ký truyền thống
            </button>
          </>
        )}
        <p className="auth-msg" style={{
          color: msg.includes('✅') ? 'green' : msg.includes('⚠️') ? 'orange' : msg.includes('❌') ? 'red' : 'inherit'
        }}>{msg}</p>
      </form>
    </div>
  );
} 
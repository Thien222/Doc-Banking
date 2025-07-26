import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useRef } from 'react';
import Notification from './components/Notification';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function FinancialDashboard() {
  const navigate = useNavigate();
  const [financialData, setFinancialData] = useState({
    monthlyData: [],
    currencyData: [],
    topAccounts: [],
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  // Chatbot state
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]); // {role: 'user'|'bot', content: string}
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Scroll to bottom when chat updates
  useEffect(() => {
    if (showChatbot && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, showChatbot]);

  // Gửi câu hỏi lên AI chatbot
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const question = chatInput.trim();
    setChatHistory(prev => [...prev, { role: 'user', content: question }]);
    setChatInput('');
    setChatLoading(true);
    try {
      // Truyền context chi tiết hơn
      const totalAmount = (financialData.monthlyData.reduce((sum, item) => sum + item.amount, 0) / 1000000000).toFixed(1);
      const completionRate = financialData.completionRate;
      const processingCount = financialData.monthlyData[financialData.monthlyData.length - 1]?.count || 0;
      const topCustomers = financialData.topAccounts.slice(0, 3).map((c, i) => `${i+1}. ${c.customer} (${(c.amount/1000000000).toFixed(2)} tỷ VND)`).join('; ');
      const currencyDist = financialData.currencyData.map(c => `${c.currency}: ${(c.amount/1000000000).toFixed(2)} tỷ VND (${c.percentage}%)`).join('; ');
      const context = `Tổng tiền giải ngân: ${totalAmount} tỷ VND. Tỷ lệ hoàn thành: ${completionRate}%. Số hồ sơ đang xử lý: ${processingCount}. Top 3 khách hàng lớn nhất: ${topCustomers}. Phân bố loại tiền: ${currencyDist}.`;
      const res = await fetch(`${process.env.REACT_APP_API_URL}/ai/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context })
      });
      const data = await res.json();
      if (data.answer) {
        setChatHistory(prev => [...prev, { role: 'bot', content: data.answer }]);
      } else {
        setChatHistory(prev => [...prev, { role: 'bot', content: 'Không có dữ liệu phù hợp trong hệ thống.' }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'bot', content: 'Lỗi khi kết nối AI. Vui lòng thử lại sau.' }]);
    }
    setChatLoading(false);
  };

  const handleChatInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  // Theme management
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Fetch financial data
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        
        const response = await fetch(`${process.env.REACT_APP_API_URL}/financial/dashboard`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'user-role': role
          }
        });

        if (!response.ok) {
          throw new Error('Không thể lấy dữ liệu tài chính');
        }

        const result = await response.json();
        
        if (result.success) {
          setFinancialData(result.data);
        } else {
          console.error('API Error:', result.message);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching financial data:', error);
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      
              const response = await fetch(`${process.env.REACT_APP_API_URL}/financial/export?format=excel`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'user-role': role
        }
      });

      if (!response.ok) {
        throw new Error('Không thể xuất báo cáo');
      }

      // Tạo blob và download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bao-cao-tai-chinh-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Lỗi khi xuất báo cáo Excel');
    }
  };

  // Chart configurations
  const monthlyChartData = {
    labels: financialData.monthlyData.map(item => item.month),
    datasets: [
      {
        label: 'Tổng tiền giải ngân (tỷ VND)',
        data: financialData.monthlyData.map(item => item.amount / 1000000000),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Số lượng hồ sơ',
        data: financialData.monthlyData.map(item => item.count),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  const currencyChartData = {
    labels: financialData.currencyData.map(item => item.currency),
    datasets: [
      {
        data: financialData.currencyData.map(item => item.percentage),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  const topAccountsChartData = {
    labels: financialData.topAccounts.map(item => item.customer),
    datasets: [
      {
        label: 'Số tiền (tỷ VND)',
        data: financialData.topAccounts.map(item => item.amount / 1000000000),
        backgroundColor: 'rgba(153, 102, 255, 0.8)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme === 'dark' ? '#ffffff' : '#333333'
        }
      },
      title: {
        display: true,
        color: theme === 'dark' ? '#ffffff' : '#333333'
      }
    },
    scales: {
      x: {
        ticks: {
          color: theme === 'dark' ? '#ffffff' : '#333333'
        },
        grid: {
          color: theme === 'dark' ? '#444444' : '#e0e0e0'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        ticks: {
          color: theme === 'dark' ? '#ffffff' : '#333333'
        },
        grid: {
          color: theme === 'dark' ? '#444444' : '#e0e0e0'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        ticks: {
          color: theme === 'dark' ? '#ffffff' : '#333333'
        },
        grid: {
          drawOnChartArea: false,
        },
      }
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--magnetic-bg)',
        color: 'var(--text-primary)'
      }}>
        <div>Đang tải dữ liệu tài chính...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '32px', 
      background: 'var(--magnetic-bg)', 
      minHeight: '100vh',
      fontFamily: 'var(--magnetic-font)',
      transition: 'all 0.3s ease',
      position: 'relative'
    }}>
      {/* Chatbot Floating Button */}
      <button
        onClick={() => setShowChatbot(s => !s)}
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          zIndex: 2000,
          background: 'linear-gradient(135deg, #4F81BD, #20c997)',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: 64,
          height: 64,
          boxShadow: '0 4px 24px rgba(79,129,189,0.18)',
          fontSize: 32,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
        }}
        title={showChatbot ? 'Đóng chatbot' : 'Chatbot AI tài chính'}
      >
        💬
      </button>
      {/* Chatbot Popup */}
      {showChatbot && (
        <div style={{
          position: 'fixed',
          bottom: 112,
          right: 32,
          width: 360,
          maxWidth: '90vw',
          height: 480,
          background: 'var(--card-bg)',
          borderRadius: 24,
          boxShadow: '0 8px 32px rgba(79,129,189,0.18)',
          zIndex: 2100,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1.5px solid var(--border-color)'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(90deg, #4F81BD, #20c997)',
            color: '#fff',
            padding: '16px 20px',
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>🤖 Chatbot Tài chính AI</span>
            <button onClick={() => setShowChatbot(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' }} title="Đóng">×</button>
          </div>
          {/* Chat history */}
          <div style={{ flex: 1, padding: 16, overflowY: 'auto', background: 'var(--magnetic-bg)' }}>
            {chatHistory.length === 0 && (
              <div style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>
                Hỏi tôi về số liệu tài chính, KPI, xu hướng...<br/>
                Ví dụ: <i>"Tổng tiền giải ngân tháng này là bao nhiêu?"</i>
              </div>
            )}
            {chatHistory.map((msg, idx) => (
              <div key={idx} style={{
                marginBottom: 12,
                textAlign: msg.role === 'user' ? 'right' : 'left'
              }}>
                <div style={{
                  display: 'inline-block',
                  background: msg.role === 'user' ? 'linear-gradient(90deg, #20c997, #4F81BD)' : '#f1f3f7',
                  color: msg.role === 'user' ? '#fff' : '#222',
                  borderRadius: 16,
                  padding: '10px 16px',
                  maxWidth: '80%',
                  fontSize: 15,
                  boxShadow: msg.role === 'user' ? '0 2px 8px rgba(32,201,151,0.08)' : 'none',
                  marginLeft: msg.role === 'user' ? 'auto' : 0,
                  marginRight: msg.role === 'user' ? 0 : 'auto',
                  whiteSpace: 'pre-line'
                }}>{msg.content}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
            {chatLoading && <div style={{ color: '#888', textAlign: 'center', fontStyle: 'italic' }}>Đang trả lời...</div>}
          </div>
          {/* Input */}
          <div style={{ padding: 12, borderTop: '1px solid #e0e0e0', background: '#fff' }}>
            <textarea
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={handleChatInputKeyDown}
              placeholder="Nhập câu hỏi tài chính..."
              style={{
                width: '100%',
                minHeight: 38,
                maxHeight: 80,
                border: '1.5px solid var(--border-color)',
                borderRadius: 12,
                padding: 10,
                fontSize: 15,
                resize: 'vertical',
                outline: 'none',
                marginBottom: 6
              }}
              disabled={chatLoading}
            />
            <button
              onClick={handleSendChat}
              disabled={chatLoading || !chatInput.trim()}
              style={{
                background: 'linear-gradient(90deg, #4F81BD, #20c997)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '8px 20px',
                fontWeight: 700,
                fontSize: 15,
                cursor: chatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer',
                float: 'right',
                marginTop: 4
              }}
            >
              Gửi
            </button>
          </div>
        </div>
      )}
      {/* Theme Toggle Button */}
      <button 
        onClick={toggleTheme}
        title={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'var(--magnetic-card-bg)',
          border: '2px solid var(--border-color)',
          borderRadius: '50px',
          padding: '12px',
          cursor: 'pointer',
          boxShadow: 'var(--magnetic-shadow)',
          transition: 'all 0.3s ease',
          zIndex: 1000,
          fontSize: '1.2rem',
          color: 'var(--text-primary)'
        }}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      {/* Logout Button */}
      <button 
        onClick={handleLogout}
        title="Đăng xuất"
        style={{
          position: 'fixed',
          top: '20px',
          right: '80px',
          background: 'var(--magnetic-card-bg)',
          border: '2px solid var(--border-color)',
          borderRadius: '50px',
          padding: '12px',
          cursor: 'pointer',
          boxShadow: 'var(--magnetic-shadow)',
          transition: 'all 0.3s ease',
          zIndex: 1000,
          fontSize: '1.2rem',
          color: 'var(--text-primary)'
        }}
      >
        🚪
      </button>

      <h1 style={{ 
        color: 'var(--magnetic-primary)', 
        marginBottom: '24px',
        fontSize: '2.5rem',
        fontWeight: 800,
        letterSpacing: '1px',
        textAlign: 'center'
      }}>
        📊 Dashboard Tài Chính
      </h1>
      
      <p style={{ 
        fontSize: '18px', 
        marginBottom: '32px',
        color: 'var(--text-primary)',
        textAlign: 'center'
      }}>
        Quản trị tín dụng - Thống kê tài chính tổng quan
      </p>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        marginBottom: '48px'
      }}>
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--magnetic-shadow)',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '12px' }}>
            Tổng tiền giải ngân
          </h3>
          <div style={{ color: 'var(--magnetic-primary)', fontSize: '2rem', fontWeight: 800 }}>
            {(financialData.monthlyData.reduce((sum, item) => sum + item.amount, 0) / 1000000000).toFixed(1)} tỷ VND
          </div>
        </div>

        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--magnetic-shadow)',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '12px' }}>
            Tỷ lệ hoàn thành
          </h3>
          <div style={{ color: 'var(--magnetic-accent)', fontSize: '2rem', fontWeight: 800 }}>
            {financialData.completionRate}%
          </div>
        </div>

        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--magnetic-shadow)',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '12px' }}>
            Số hồ sơ đang xử lý
          </h3>
          <div style={{ color: 'var(--magnetic-primary)', fontSize: '2rem', fontWeight: 800 }}>
            {financialData.monthlyData[financialData.monthlyData.length - 1]?.count || 0}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '32px',
        marginBottom: '32px'
      }}>
        {/* Monthly Trend Chart */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--magnetic-shadow)',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ 
            color: 'var(--text-primary)', 
            marginBottom: '20px',
            fontSize: '1.3rem',
            fontWeight: 700
          }}>
            📈 Xu hướng giải ngân theo tháng
          </h3>
          <Line data={monthlyChartData} options={chartOptions} />
        </div>

        {/* Currency Distribution */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--magnetic-shadow)',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ 
            color: 'var(--text-primary)', 
            marginBottom: '20px',
            fontSize: '1.3rem',
            fontWeight: 700
          }}>
            💱 Phân bố theo loại tiền
          </h3>
          <Doughnut 
            data={currencyChartData} 
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    color: theme === 'dark' ? '#ffffff' : '#333333'
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Top Accounts Chart */}
      <div style={{
        background: 'var(--card-bg)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: 'var(--magnetic-shadow)',
        border: '1px solid var(--border-color)',
        marginBottom: '32px'
      }}>
        <h3 style={{ 
          color: 'var(--text-primary)', 
          marginBottom: '20px',
          fontSize: '1.3rem',
          fontWeight: 700
        }}>
          🏆 Top 5 tài khoản có số tiền lớn nhất
        </h3>
        <Bar data={topAccountsChartData} options={chartOptions} />
      </div>

      {/* Navigation Buttons */}
      <div style={{
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: '32px'
      }}>
        <button 
          onClick={() => navigate('/qttd-nhan-ban-giao')}
          style={{
            background: 'linear-gradient(135deg, var(--magnetic-primary) 0%, var(--magnetic-accent) 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          📋 Nhận bàn giao
        </button>
        
        <button 
          onClick={() => navigate('/qttd-hoan-tra')}
          style={{
            background: 'linear-gradient(135deg, var(--magnetic-accent) 0%, var(--magnetic-primary) 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          🔄 Hoàn trả
        </button>
        

      </div>

      {/* Export Excel Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '32px'
      }}>
        <button 
          onClick={handleExportExcel}
          style={{
            background: 'linear-gradient(135deg, #28a745, #20c997)',
            color: '#fff',
            border: 'none',
            borderRadius: '16px',
            padding: '16px 32px',
            fontSize: '1.1rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 16px rgba(40,167,69,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px) scale(1.02)';
            e.target.style.boxShadow = '0 8px 24px rgba(40,167,69,0.3)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0) scale(1)';
            e.target.style.boxShadow = '0 4px 16px rgba(40,167,69,0.2)';
          }}
        >
          📊 Xuất báo cáo Excel
        </button>
      </div>
      <Notification />
    </div>
  );
} 
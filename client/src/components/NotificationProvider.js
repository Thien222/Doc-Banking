import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

const NotificationProvider = ({ socket, children }) => {
  const [lastNotification, setLastNotification] = useState(null);

  useEffect(() => {

    
    if (!socket) {
      
      return;
    }
    
    // Đợi socket kết nối
    const handleConnect = () => {
      
      
      const handleNotification = (notif) => {
        try {

          setLastNotification(notif);
          
          // Sử dụng try-catch cho toast operations
          try {
            toast.dismiss();
          } catch (toastError) {
            console.warn('⚠️ Toast dismiss error:', toastError);
          }
          
          toast(
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>
                  {notif.title || 'Thông báo'}
                </div>
                <div style={{ fontSize: 14, color: '#333' }}>{notif.message}</div>
                {notif.data?.hosoId && (
                  <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                    Mã hồ sơ: <b>{notif.data.hosoId}</b>
                  </div>
                )}
              </div>
            </div>,
            {
              position: 'top-right',
              autoClose: 9000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              style: { background: '#f5f6fa', borderRadius: 12, minWidth: 320 },
            }
          );
        } catch (error) {
          console.error('❌ [NotificationProvider] Error handling notification:', error);
        }
      };
      
      socket.on('notification', handleNotification);
      
      
      return () => {
        
        socket.off('notification', handleNotification);
      };
    };
    
    if (socket.connected) {
      return handleConnect();
    } else {
      socket.on('connect', handleConnect);
      return () => {
        socket.off('connect', handleConnect);
      };
    }
  }, [socket]);

  return (
    <NotificationContext.Provider value={{ lastNotification }}>
      {children}
      <ToastContainer />
    </NotificationContext.Provider>
  );
};

export default NotificationProvider; 
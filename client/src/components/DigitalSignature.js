import React, { useRef, useEffect, useState } from 'react';

const DigitalSignature = ({ onSave, onCancel, title = "Chữ ký số" }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [context, setContext] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 400;
    canvas.height = 200;
    
    // Set drawing style
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    setContext(ctx);
  }, []);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    context.lineTo(x, y);
    context.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasSignature(false);
  };

  const saveSignature = () => {
    if (!hasSignature) {
      alert('Vui lòng ký trước khi lưu!');
      return;
    }
    
    const signatureData = canvasRef.current.toDataURL('image/png');
    const signatureInfo = {
      data: signatureData,
      timestamp: new Date().toISOString(),
      user: localStorage.getItem('username') || 'Unknown',
      role: localStorage.getItem('role') || 'Unknown'
    };
    
    onSave(signatureInfo);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        maxWidth: '500px',
        width: '90%'
      }}>
        <h3 style={{ margin: '0 0 20px 0', textAlign: 'center', color: '#333' }}>
          {title}
        </h3>
        
        <div style={{
          border: '2px dashed #ccc',
          borderRadius: '8px',
          padding: '10px',
          marginBottom: '20px',
          background: '#f9f9f9'
        }}>
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            style={{
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'crosshair',
              width: '100%',
              height: '200px'
            }}
          />
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: '20px', color: '#666', fontSize: '14px' }}>
          Vẽ chữ ký của bạn vào khung trên
        </div>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={clearSignature}
            style={{
              padding: '10px 20px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              background: '#f5f5f5',
              cursor: 'pointer'
            }}
          >
            Xóa chữ ký
          </button>
          <button
            onClick={saveSignature}
            disabled={!hasSignature}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              background: hasSignature ? '#007bff' : '#ccc',
              color: 'white',
              cursor: hasSignature ? 'pointer' : 'not-allowed'
            }}
          >
            Lưu chữ ký
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              background: '#f5f5f5',
              cursor: 'pointer'
            }}
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default DigitalSignature; 
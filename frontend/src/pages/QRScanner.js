import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import '../styles/global.css';

const QRScanner = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(true);

  const handleScan = (result) => {
    if (result && result.length > 0) {
      const scannedValue = result[0].rawValue;
      // Basic URL validation
      if (scannedValue.includes('gym') || scannedValue.includes('register') || scannedValue.includes('book') || scannedValue.startsWith('http')) {
        navigate('/book');
      } else {
        setError('Invalid QR Code. Please scan a valid gym registration QR.');
      }
    }
  };

  const handleError = (err) => {
    console.error(err);
    setError('Failed to access camera or scan QR.');
  };

  return (
    <div className="container">
      <h1>Welcome to GYM Booking</h1>
      <p>Please scan the QR code to proceed to registration.</p>

      <div style={{ maxWidth: '400px', margin: '0 auto', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
        {isScanning ? (
          <Scanner
            onScan={handleScan}
            onError={handleError}
          />
        ) : (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eee' }}>
            <p>Camera is stopped</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button onClick={() => setIsScanning(!isScanning)} className="btn">
          {isScanning ? 'Stop Camera' : 'Start Camera'}
        </button>
      </div>

      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

      <p style={{ marginTop: '20px' }}>
        <button onClick={() => navigate('/book')} className="btn" style={{ background: '#6c757d' }}>
          Skip & Proceed to Registration
        </button>
      </p>
    </div>
  );
};

export default QRScanner;

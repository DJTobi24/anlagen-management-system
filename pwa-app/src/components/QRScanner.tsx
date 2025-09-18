import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Upload } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  title?: string;
}

export default function QRScanner({ onScan, onClose, title = "QR-Code scannen" }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScanning(true);
        
        // Start scanning when video is ready
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play();
            scanQRCode();
          }
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Kamera konnte nicht geöffnet werden. Bitte Berechtigungen prüfen.');
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const scanQRCode = async () => {
    if (!videoRef.current || !scanning) return;

    try {
      // Create canvas for image processing
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (context && videoRef.current.videoWidth > 0) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Try to detect QR code using jsQR library
        const jsQR = (window as any).jsQR;
        if (jsQR) {
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            stopScanning();
            onScan(code.data);
            onClose();
            return;
          }
        }
      }
      
      // Continue scanning
      if (scanning) {
        requestAnimationFrame(scanQRCode);
      }
    } catch (err) {
      console.error('Scan error:', err);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);
          
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const jsQR = (window as any).jsQR;
          
          if (jsQR) {
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
              onScan(code.data);
              onClose();
            } else {
              setError('Kein QR-Code im Bild gefunden');
            }
          }
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      <div className="bg-white p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          onClick={() => {
            stopScanning();
            onClose();
          }}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 relative">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <Camera className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-white text-center mb-4">{error}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Bild hochladen
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-white w-64 h-64 rounded-lg shadow-lg">
                <div className="w-full h-full border-2 border-transparent animate-pulse" />
              </div>
            </div>
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <p className="text-white text-lg">QR-Code in den Rahmen halten</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-white underline"
              >
                Oder Bild hochladen
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Upload, Flashlight, FlashlightOff, RotateCcw } from 'lucide-react';

interface UniversalScannerProps {
  onScan: (data: string, type: 'qr' | 'barcode') => void;
  onClose: () => void;
  title?: string;
  scanType?: 'qr' | 'barcode' | 'both';
  helpText?: string;
}

export default function UniversalScanner({ 
  onScan, 
  onClose, 
  title = "Code scannen",
  scanType = 'both',
  helpText
}: UniversalScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, [facingMode]);

  const startScanning = async () => {
    try {
      stopScanning(); // Stop any existing stream first
      
      // Request camera with constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScanning(true);
        setError('');
        
        // Start scanning when video is ready
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play();
            startContinuousScanning();
          }
        };

        // Check for torch support
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if ('torch' in capabilities) {
          // Torch is available
        }
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Kamera-Zugriff wurde verweigert. Bitte Berechtigungen in den Einstellungen prüfen.');
      } else if (err.name === 'NotFoundError') {
        setError('Keine Kamera gefunden.');
      } else {
        setError('Kamera konnte nicht geöffnet werden.');
      }
    }
  };

  const stopScanning = () => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
    setTorchEnabled(false);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchEnabled } as any]
      });
      setTorchEnabled(!torchEnabled);
    } catch (err) {
      console.error('Torch toggle failed:', err);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const startContinuousScanning = () => {
    const scan = async () => {
      if (!videoRef.current || !scanning || !canvasRef.current) {
        animationIdRef.current = requestAnimationFrame(scan);
        return;
      }

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context && videoRef.current.videoWidth > 0) {
        // Set canvas size to match video
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        
        // Draw current video frame
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // Get image data for scanning
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Try QR code detection
        if (scanType === 'qr' || scanType === 'both') {
          const jsQR = (window as any).jsQR;
          if (jsQR) {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert"
            });
            
            if (code && code.data !== lastScannedCode) {
              handleSuccessfulScan(code.data, 'qr');
              return;
            }
          }
        }
        
        // Try barcode detection using native API if available
        if ((scanType === 'barcode' || scanType === 'both') && 'BarcodeDetector' in window) {
          try {
            const barcodeDetector = new (window as any).BarcodeDetector({
              formats: ['code_128', 'code_39', 'code_93', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code']
            });
            
            const barcodes = await barcodeDetector.detect(canvas);
            if (barcodes.length > 0 && barcodes[0].rawValue !== lastScannedCode) {
              const format = barcodes[0].format;
              const type = format === 'qr_code' ? 'qr' : 'barcode';
              handleSuccessfulScan(barcodes[0].rawValue, type);
              return;
            }
          } catch (err) {
            // Barcode API not supported or error
            console.log('Barcode detection not available');
          }
        }
      }
      
      // Continue scanning
      animationIdRef.current = requestAnimationFrame(scan);
    };
    
    scan();
  };

  const handleSuccessfulScan = (data: string, type: 'qr' | 'barcode') => {
    setLastScannedCode(data);
    setScanSuccess(true);
    
    // Vibrate if available
    if ('vibrate' in navigator) {
      navigator.vibrate(200);
    }
    
    // Play success sound if needed
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSp9y+3ekDYJFGS35+OmVBUCQ5zbw7NvJAkiece+2ZE7CSReu+js0uLksgAA');
    audio.play().catch(() => {});
    
    // Stop scanning and notify
    stopScanning();
    setTimeout(() => {
      onScan(data, type);
      onClose();
    }, 500);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);
          
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          // Try QR detection
          const jsQR = (window as any).jsQR;
          if (jsQR) {
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
              handleSuccessfulScan(code.data, 'qr');
              return;
            }
          }
          
          // Try barcode detection
          if ('BarcodeDetector' in window) {
            try {
              const barcodeDetector = new (window as any).BarcodeDetector();
              const barcodes = await barcodeDetector.detect(img);
              
              if (barcodes.length > 0) {
                const format = barcodes[0].format;
                const type = format === 'qr_code' ? 'qr' : 'barcode';
                handleSuccessfulScan(barcodes[0].rawValue, type);
                return;
              }
            } catch (err) {
              console.log('Barcode detection failed');
            }
          }
          
          setError('Kein Code im Bild gefunden');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const getScanAreaStyle = () => {
    if (scanType === 'barcode') {
      return 'w-80 h-32'; // Wider for barcodes
    }
    return 'w-64 h-64'; // Square for QR codes
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
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

      {/* Main scanning area */}
      <div className="flex-1 relative">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <Camera className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-white text-center mb-4">{error}</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setError('');
                  startScanning();
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg"
              >
                Erneut versuchen
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Bild hochladen
              </button>
            </div>
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
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {/* Scan overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`border-2 ${scanSuccess ? 'border-green-400' : 'border-white'} ${getScanAreaStyle()} rounded-lg shadow-lg transition-colors`}>
                <div className="w-full h-full relative">
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                  
                  {/* Scanning animation */}
                  {scanning && !scanSuccess && (
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="h-0.5 bg-red-500 animate-scan"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Instructions */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <p className="text-white text-lg mb-2">
                {helpText || (scanType === 'barcode' ? 'Barcode in den Rahmen halten' : 'Code in den Rahmen halten')}
              </p>
              
              {/* Control buttons */}
              <div className="flex justify-center gap-4 mb-4">
                {streamRef.current && (
                  <>
                    <button
                      onClick={toggleTorch}
                      className="bg-black bg-opacity-50 text-white p-3 rounded-full"
                      title="Taschenlampe"
                    >
                      {torchEnabled ? <FlashlightOff className="w-5 h-5" /> : <Flashlight className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={toggleCamera}
                      className="bg-black bg-opacity-50 text-white p-3 rounded-full"
                      title="Kamera wechseln"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-black bg-opacity-50 text-white p-3 rounded-full"
                  title="Bild hochladen"
                >
                  <Upload className="w-5 h-5" />
                </button>
              </div>
              
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
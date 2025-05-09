
"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5QrcodeScanType } from 'html5-qrcode';
import type { QrcodeSuccessCallback, QrcodeErrorCallback } from 'html5-qrcode/esm/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScanLine, CheckCircle, XCircle, VideoOff, Loader2 } from 'lucide-react';

interface QrScannerProps {
  onScanSuccess: (decodedText: string, decodedResult: any) => void;
  onScanFailure?: (error: any) => void;
  isScanningDisabled?: boolean;
}

const QR_SCANNER_ELEMENT_ID = "qr-reader";

export function QrScanner({ onScanSuccess, onScanFailure, isScanningDisabled }: QrScannerProps) {
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error' | 'permission_denied' | 'initializing'>('idle');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const readerElementRef = useRef<HTMLDivElement>(null);


  const clearScanner = useCallback(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear().catch(e => console.warn("Minor error clearing scanner:", e));
      } catch (e) {
        console.warn("Error during scanner clear (already cleared?):", e);
      }
      scannerRef.current = null;
    }
    setIsScannerActive(false);
  }, []);
  
  const startScan = useCallback(() => {
    if (isScanningDisabled || isScannerActive || scanStatus === 'initializing') return;
    
    setScanStatus('initializing');

    navigator.mediaDevices.getUserMedia({ video: true })
    .then(() => {
      // Ensure the div exists before rendering
      if (!readerElementRef.current || !document.getElementById(QR_SCANNER_ELEMENT_ID)) {
        console.error("QR Reader element not found in DOM.");
        setScanStatus('error');
        if (onScanFailure) onScanFailure("QR Scanner UI element not ready.");
        return;
      }
      
      setIsScannerActive(true); // Now activate scanner UI
      setScanStatus('idle'); // Back to idle while camera starts

      // Initialize scanner
      const html5QrcodeScanner = new Html5QrcodeScanner(
        QR_SCANNER_ELEMENT_ID,
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
        },
        false // verbose
      );
  
      const successCallback: QrcodeSuccessCallback = (decodedText, decodedResult) => {
        clearScanner();
        setScanStatus('success');
        onScanSuccess(decodedText, decodedResult);
      };
  
      const errorCallback: QrcodeErrorCallback = (errorMessage) => {
        if (errorMessage.toLowerCase().includes("not found")) return; // Ignore common "QR Code no longer detected"
        
        if (onScanFailure) {
          onScanFailure(errorMessage);
        }
        // Don't set error status here to allow continuous scanning unless it's a critical error
      };
      
      html5QrcodeScanner.render(successCallback, errorCallback);
      scannerRef.current = html5QrcodeScanner;
    })
    .catch((err) => {
      console.error("Camera permission denied:", err);
      setScanStatus('permission_denied');
      if (onScanFailure) {
        onScanFailure("Camera permission denied. Please enable camera access in your browser settings.");
      }
    });
  }, [isScanningDisabled, isScannerActive, scanStatus, onScanSuccess, onScanFailure, clearScanner]);
  
  const stopScan = useCallback(() => {
    clearScanner();
    // Don't reset scanStatus here to persist success/error message if needed
  }, [clearScanner]);

  useEffect(() => {
    return () => { // Cleanup on unmount
      clearScanner();
    };
  }, [clearScanner]);
  
  useEffect(() => { // If scanning becomes disabled while active, stop the scan
    if (isScanningDisabled && isScannerActive) {
      stopScan();
    }
  }, [isScanningDisabled, isScannerActive, stopScan]);

  let statusContent;
  if (scanStatus === 'permission_denied') {
    statusContent = (
      <>
        <VideoOff size={48} className="mb-2 text-destructive" />
        <p className="text-destructive font-semibold">Camera Permission Denied</p>
        <p className="text-xs">Enable camera access in browser settings and refresh.</p>
      </>
    );
  } else if (scanStatus === 'initializing') {
     statusContent = (
      <>
        <Loader2 size={48} className="mb-2 animate-spin text-primary" />
        <p>Initializing Camera...</p>
      </>
    );
  } else if (!isScannerActive && scanStatus !== 'success') {
    statusContent = (
      <>
        <ScanLine size={48} className="mb-2" />
        <p>Click "Start Scan" to open your camera.</p>
        {isScanningDisabled && <p className="text-xs text-destructive mt-1">Scanning is currently disabled.</p>}
      </>
    );
  }


  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <ScanLine className="h-6 w-6 text-primary" />
          Scan QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div 
            id={QR_SCANNER_ELEMENT_ID} 
            ref={readerElementRef}
            className="w-full min-h-[250px] border border-dashed border-border rounded-md overflow-hidden bg-muted"
            style={{ display: isScannerActive ? 'block' : (statusContent ? 'flex' : 'none') }} // Control visibility
        >
          {statusContent && !isScannerActive && ( // Show status only if scanner is not active
             <div className="flex flex-col items-center justify-center h-full w-full p-4 text-center text-muted-foreground">
                {statusContent}
             </div>
          )}
        </div>
        
        {!isScannerActive ? (
          <Button onClick={startScan} className="w-full" disabled={isScanningDisabled || scanStatus === 'permission_denied' || scanStatus === 'initializing'}>
            {scanStatus === 'initializing' ? <Loader2 className="animate-spin"/> : null}
            {scanStatus === 'initializing' ? 'Starting...' : 'Start Scan'}
          </Button>
        ) : (
          <Button onClick={stopScan} variant="outline" className="w-full" disabled={isScanningDisabled}>
            Stop Scan
          </Button>
        )}

        {scanStatus === 'success' && (
          <div className="flex items-center gap-2 text-green-600 mt-2">
            <CheckCircle className="h-5 w-5" />
            <p>QR Code Scanned Successfully!</p>
          </div>
        )}
        {scanStatus === 'error' && ( // General error, not permission denied
          <div className="flex items-center gap-2 text-destructive mt-2">
            <XCircle className="h-5 w-5" />
            <p>Failed to scan QR Code. Please try again.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Zap, Keyboard, Camera } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  onReportMissing?: (barcode: string) => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onScan, onClose, onReportMissing }) => {
  const { t } = useLanguage();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isManual, setIsManual] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const isProcessingRef = useRef(false);
  const [isProcessing, setIsProcessingState] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const isMounted = useRef(true);
  const isTransitioning = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Check for multiple cameras
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length > 1) {
        setHasMultipleCameras(true);
      }
    }).catch(err => console.debug("Error checking cameras:", err));
  }, []);

  const setIsProcessing = (val: boolean) => {
    isProcessingRef.current = val;
    setIsProcessingState(val);
  };

  useEffect(() => {
    if (isManual) {
      if (scannerRef.current && scannerRef.current.isScanning && !isTransitioning.current) {
        isTransitioning.current = true;
        scannerRef.current.stop()
          .catch(err => console.debug("Scanner stop notice:", err))
          .finally(() => {
            isTransitioning.current = false;
          });
      }
      return;
    }

    const html5QrCode = new Html5Qrcode("reader", {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.ITF
      ],
      verbose: false
    });
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      if (isTransitioning.current) return;
      isTransitioning.current = true;

      try {
        const readerElement = document.getElementById("reader");
        if (readerElement) readerElement.innerHTML = "";

        const config = {
          fps: 30,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.max(50, Math.floor(minEdge * 0.7));
            return { width: size, height: Math.max(50, Math.floor(size * 0.6)) };
          },
          aspectRatio: undefined,
          disableFlip: false
        };

        await html5QrCode.start(
          { facingMode: facingMode },
          config,
          (decodedText) => {
            if (scannerRef.current?.isScanning && !isProcessingRef.current) {
              setIsProcessing(true);
              playScanSound();

              onScan(decodedText);
            }
          },
          () => {}
        );

        // Re-check cameras after successful start to ensure we have permissions
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 1) {
          setHasMultipleCameras(true);
        }
      } catch (err: any) {
        console.error("Unable to start scanner", err);
        if (err?.name === 'NotAllowedError' || err?.toString().includes('Permission denied')) {
          setPermissionError(t('camera_permission_denied') || "Permiso de cámara denegado. Por favor, actívalo en los ajustes de tu navegador.");
          isTransitioning.current = false;
          return;
        }
        try {
          if (scannerRef.current) {
            await html5QrCode.start(
              { facingMode: "user" },
              { fps: 15, qrbox: { width: 250, height: 150 } },
              (decodedText) => {
                if (scannerRef.current?.isScanning && !isProcessingRef.current) {
                  setIsProcessing(true);
                  playScanSound();
                  onScan(decodedText);
                }
              },
              () => {}
            );
          }
        } catch (fallbackErr) {
          console.error("Fallback scanner failed", fallbackErr);
        }
      } finally {
        isTransitioning.current = false;
      }
    };

    startScanner();

    return () => {
      const cleanup = async () => {
        if (scannerRef.current) {
          const instance = scannerRef.current;
          scannerRef.current = null;
          
          if (isTransitioning.current) {
            // If already transitioning, we might need to wait or just skip
            // but for cleanup we should try to force it if possible or at least not crash
          }
          isTransitioning.current = true;

          try {
            if (instance.isScanning) {
              // Manually pause the video element if it exists to prevent "play() interrupted" errors
              // when the element is removed from the DOM by html5-qrcode's stop() or React's unmount
              const element = document.getElementById("reader");
              const video = element?.querySelector('video');
              if (video) {
                try {
                  video.pause();
                  video.srcObject = null;
                } catch (e) {
                  // Ignore errors during manual pause
                }
              }

              // Use a timeout to prevent hanging on stop
              const stopPromise = instance.stop();
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Timeout")), 3000)
              );
              await Promise.race([stopPromise, timeoutPromise]);
            }
            
            // Only clear if the element is still in the DOM
            const element = document.getElementById("reader");
            if (element) {
              await instance.clear();
            }
          } catch (err) {
            // Silently handle cleanup errors as they are often just race conditions
            console.debug("Scanner cleanup notice:", err);
          } finally {
            isTransitioning.current = false;
          }
        }
      };
      cleanup();
    };
  }, [onScan, isManual, t, facingMode]);

  const toggleCamera = () => {
    if (isTransitioning.current) return;
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  const playScanSound = () => {
    if (!isMounted.current) return;
    try {
      // Create a new instance each time to avoid interruption of previous play requests
      // and "removed from document" errors that can happen when reusing/cleaning up a single ref
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      audio.volume = 0.5;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Ignore AbortError and NotAllowedError as they are common and benign in this context
          if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
            console.debug("Audio play error:", err);
          }
        });
      }
    } catch (e) {
      console.debug("Audio error:", e);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[100] bg-[#050505] flex flex-col"
    >
      <div className="noise-overlay" />
      
      {/* Header */}
      <div className="p-8 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl premium-gradient flex items-center justify-center">
            <Shield className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display tracking-tight">{t('ai_scanner')}</h2>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Active Sensing</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-3 rounded-2xl glass-button text-white/40 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>
      
      {/* Scanner Region */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <AnimatePresence mode="wait">
          {permissionError ? (
            <motion.div 
              key="permission-error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm p-8 rounded-[3rem] glass-card border-rose-500/20 text-center space-y-6"
            >
              <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto">
                <Shield className="text-rose-500" size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-rose-500">{t('camera_error') || "Error de Cámara"}</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  {permissionError}
                </p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 rounded-2xl bg-white text-black font-bold hover:scale-[1.02] active:scale-95 transition-all"
              >
                {t('retry') || "Reintentar"}
              </button>
            </motion.div>
          ) : !isManual ? (
            <motion.div 
              key="camera"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm aspect-square"
            >
              {/* Tech Frame */}
              <div className="absolute inset-0 border-2 border-white/5 rounded-[3rem] pointer-events-none" />
              
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-emerald-500 rounded-tl-[3rem]" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-emerald-500 rounded-tr-[3rem]" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-emerald-500 rounded-bl-[3rem]" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-emerald-500 rounded-br-[3rem]" />

              {/* Scanning Line */}
              <motion.div 
                animate={{ top: ['10%', '90%', '10%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute left-6 right-6 h-[2px] bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)] z-20"
              />

              <div id="reader" className="w-full h-full" />
            </motion.div>
          ) : (
            <motion.div 
              key="manual"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm p-8 rounded-[3rem] glass-card border-emerald-500/20 space-y-6"
            >
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold tracking-tight">{t('manual_entry')}</h3>
                <p className="text-xs text-white/40">{t('manual_desc')}</p>
              </div>
              
              <div className="space-y-4">
                <input 
                  type="number"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="7613036249928"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-center text-xl font-mono tracking-widest focus:outline-none focus:border-emerald-500 transition-all"
                />
                <button 
                  onClick={() => {
                    if (manualBarcode && !isProcessing) {
                      setIsProcessing(true);
                      onScan(manualBarcode);
                    }
                  }}
                  disabled={!manualBarcode || isProcessing}
                  className="w-full py-4 rounded-2xl bg-emerald-500 text-black font-bold hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      {t('analyzing_ingredients')}
                    </>
                  ) : (
                    t('analyze_product')
                  )}
                </button>
                
                {onReportMissing && manualBarcode && (
                  <button 
                    onClick={() => onReportMissing(manualBarcode)}
                    className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-bold text-sm hover:bg-white/10 transition-all"
                  >
                    Informar producto faltante
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 space-y-6 text-center">
          {!isManual && (
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <span className="text-xs font-black uppercase tracking-[0.3em]">{t('analyzing_ingredients')}</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} className="animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-[0.3em]">{t('searching_code')}</span>
                  </>
                )}
              </div>

              {hasMultipleCameras && !permissionError && (
                <button 
                  onClick={toggleCamera}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all text-white/60 hover:text-white"
                >
                  <Camera size={14} />
                  {facingMode === "environment" ? t('switch_to_front') || "Cámara Frontal" : t('switch_to_rear') || "Cámara Trasera"}
                </button>
              )}
            </div>
          )}
          
          <button 
            onClick={() => {
              setIsManual(!isManual);
              setPermissionError(null);
            }}
            className="flex items-center gap-2 mx-auto px-6 py-3 rounded-full bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all"
          >
            {isManual ? (
              <><Camera size={14} /> {t('use_camera')}</>
            ) : (
              <><Keyboard size={14} /> {t('manual_entry')}</>
            )}
          </button>
        </div>
      </div>

      {/* Footer Decoration */}
      <div className="p-12 flex justify-center opacity-10">
        <div className="w-1 h-12 bg-white rounded-full" />
      </div>
    </motion.div>
  );
};

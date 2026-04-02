import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { X, RefreshCw, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ReloadPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {(offlineReady || needRefresh) && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-80 z-[100]"
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl backdrop-blur-xl bg-opacity-90">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl ${offlineReady ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                {offlineReady ? <Download size={20} /> : <RefreshCw size={20} className={needRefresh ? 'animate-spin' : ''} />}
              </div>
              <div className="flex-1">
                <h4 className="text-white font-medium text-sm">
                  {offlineReady ? 'App lista para usar offline' : 'Nueva actualización'}
                </h4>
                <p className="text-zinc-400 text-xs mt-1">
                  {offlineReady 
                    ? 'DeenSnap ya funciona sin conexión a internet.' 
                    : 'Hay una nueva versión disponible con mejoras.'}
                </p>
              </div>
              <button 
                onClick={close}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            {needRefresh && (
              <div className="mt-4">
                <button
                  onClick={() => updateServiceWorker(true)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} />
                  Actualizar ahora
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReloadPrompt;

import React from 'react';
import { motion } from 'motion/react';
import { Menu, Clock, ArrowRight, Heart } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Screen } from '../../types';
import { statusConfig } from '../../constants/statusConfig';
import { getSavedProduct } from '../../services/supabase';

interface FavoritesScreenProps {
  t: (key: any) => string;
  setScreen: (s: Screen) => void;
  favoritesWithAlerts: any[];
  setLoading: (l: boolean) => void;
  setLoadingMessage: (m: string) => void;
  setCurrentProduct: (p: any) => void;
}

export const FavoritesScreen = React.memo(({ 
  t, 
  setScreen, 
  favoritesWithAlerts, 
  setLoading, 
  setLoadingMessage, 
  setCurrentProduct 
}: FavoritesScreenProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen p-6 pb-32"
    >
      <div className="flex items-center justify-between mb-10 pt-6">
        <h1 className="text-4xl font-bold font-display tracking-tight">Favoritos</h1>
        <button onClick={() => setScreen('settings')} className="p-3 rounded-2xl glass-button">
          <Menu size={20} />
        </button>
      </div>
      
      <div className="space-y-4">
        {favoritesWithAlerts.length > 0 ? favoritesWithAlerts.map((item, i) => {
          const config = (statusConfig as any)[item.status] || {
            color: 'text-white/40',
            bgColor: 'bg-white/5',
            icon: Clock
          };
          const StatusIcon = config.icon;

          return (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={async () => {
                setLoading(true);
                setLoadingMessage(t('loading_favorites') || "Cargando favoritos...");
                const prod = await getSavedProduct(item.barcode);
                if (prod) {
                  setCurrentProduct(prod as any);
                  setScreen('result');
                }
                setLoading(false);
              }}
              className="p-6 rounded-[2.5rem] glass-card border-white/5 flex items-center justify-between group hover:bg-white/[0.06] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-5">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                  config.bgColor
                )}>
                  <StatusIcon size={24} className={config.color} />
                </div>
                <div>
                  <h4 className="font-bold text-base tracking-tight truncate max-w-[180px]">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("text-[10px] font-black tracking-widest px-2 py-0.5 rounded bg-black/20", config.color)}>
                      {item.status}
                    </span>
                    <span className="text-[10px] text-white/20 font-medium">
                      {item.barcode}
                    </span>
                  </div>
                </div>
              </div>
              <ArrowRight size={20} className="text-white/20" />
            </motion.div>
          );
        }) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <Heart size={64} className="mb-4" />
            <p className="font-medium">No tienes favoritos aún</p>
          </div>
        )}
      </div>
    </motion.div>
  );
});

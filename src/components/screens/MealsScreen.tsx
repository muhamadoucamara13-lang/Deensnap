import React from 'react';
import { motion } from 'motion/react';
import { Menu, Utensils } from 'lucide-react';
import { Screen } from '../../types';

interface MealsScreenProps {
  setScreen: (s: Screen) => void;
  meals: any[];
}

export const MealsScreen = React.memo(({ 
  setScreen, 
  meals 
}: MealsScreenProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen p-6 pb-32"
    >
      <div className="flex items-center justify-between mb-10 pt-6">
        <h1 className="text-4xl font-bold font-display tracking-tight">Mis Comidas</h1>
        <button onClick={() => setScreen('settings')} className="p-3 rounded-2xl glass-button">
          <Menu size={20} />
        </button>
      </div>
      
      <div className="space-y-4">
        {meals.length > 0 ? meals.map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-6 rounded-[2.5rem] glass-card border-white/5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Utensils size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-base tracking-tight">{item.product_name}</h4>
                  <p className="text-[10px] text-white/20 font-mono tracking-widest">{item.barcode}</p>
                </div>
              </div>
              <span className="text-xs text-white/40 font-bold">
                {new Date(item.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 rounded-xl bg-white/5">
                <div className="text-[8px] text-white/20 font-bold uppercase">Cal</div>
                <div className="text-xs font-bold">{Math.round(item.calories || 0)}</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-white/5">
                <div className="text-[8px] text-white/20 font-bold uppercase">Prot</div>
                <div className="text-xs font-bold">{item.proteins?.toFixed(1) || 0}g</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-white/5">
                <div className="text-[8px] text-white/20 font-bold uppercase">Grasa</div>
                <div className="text-xs font-bold">{item.fat?.toFixed(1) || 0}g</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-white/5">
                <div className="text-[8px] text-white/20 font-bold uppercase">Carb</div>
                <div className="text-xs font-bold">{item.carbs?.toFixed(1) || 0}g</div>
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <Utensils size={64} className="mb-4" />
            <p className="font-medium">No has registrado comidas hoy</p>
          </div>
        )}
      </div>
    </motion.div>
  );
});

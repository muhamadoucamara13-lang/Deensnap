import React from 'react';
import { motion } from 'motion/react';
import { Menu, AlertTriangle } from 'lucide-react';
import { Screen } from '../../types';

interface TermsSettingsScreenProps {
  t: (key: any) => string;
  setScreen: (s: Screen) => void;
}

export const TermsSettingsScreen = React.memo(({ 
  t, 
  setScreen 
}: TermsSettingsScreenProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen p-8 pb-32"
    >
      <div className="flex items-center gap-4 mb-12 pt-6">
        <button onClick={() => setScreen('settings')} className="p-3 rounded-2xl glass-button">
          <Menu size={20} className="rotate-180" />
        </button>
        <h1 className="text-3xl font-bold font-display tracking-tight">{t('terms_conditions')}</h1>
      </div>

      <div className="space-y-6">
        <div className="p-8 rounded-[2.5rem] glass-card border-white/5 space-y-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white">{t('terms_conditions')}</h4>
              <p className="text-sm text-white/60 leading-relaxed">{t('terms_intro')}</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white">{t('terms_usage_title')}</h4>
              <p className="text-sm text-white/60 leading-relaxed">{t('terms_usage')}</p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <div className="flex items-center gap-2 text-rose-500 mb-2">
                <AlertTriangle size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">{t('terms_disclaimer_title')}</span>
              </div>
              <p className="text-xs text-rose-500/80 leading-relaxed font-medium">
                {t('terms_disclaimer')}
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setScreen('settings')}
          className="w-full py-6 rounded-[2rem] bg-white text-black font-bold hover:scale-[1.02] active:scale-95 transition-all"
        >
          {t('understood')}
        </button>
      </div>
    </motion.div>
  );
});

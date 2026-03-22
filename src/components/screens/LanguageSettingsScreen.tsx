import React from 'react';
import { motion } from 'motion/react';
import { Menu, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Screen } from '../../types';

interface LanguageSettingsScreenProps {
  t: (key: any) => string;
  setScreen: (s: Screen) => void;
  language: string;
  setLanguage: (l: 'es' | 'en' | 'fr' | 'ar') => void;
}

export const LanguageSettingsScreen = React.memo(({ 
  t, 
  setScreen, 
  language, 
  setLanguage 
}: LanguageSettingsScreenProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen p-8"
    >
      <div className="flex items-center gap-4 mb-12 pt-6">
        <button onClick={() => setScreen('settings')} className="p-3 rounded-2xl glass-button">
          <Menu size={20} className="rotate-180" />
        </button>
        <h1 className="text-3xl font-bold font-display tracking-tight">{t('language')}</h1>
      </div>

      <div className="space-y-4">
        <p className="text-white/40 px-2 mb-6">{t('choose_language')}</p>
        {[
          { id: 'es', label: 'Español', flag: '🇪🇸' },
          { id: 'en', label: 'English', flag: '🇬🇧' },
          { id: 'fr', label: 'Français', flag: '🇫🇷' },
          { id: 'ar', label: 'العربية', flag: '🇸🇦' }
        ].map((lang) => (
          <button
            key={lang.id}
            onClick={() => {
              setLanguage(lang.id as any);
              setScreen('settings');
            }}
            className={cn(
              "w-full flex items-center justify-between p-6 rounded-[2rem] glass-card border-white/5 transition-all",
              language === lang.id ? "bg-white text-black" : "hover:bg-white/5"
            )}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-bold">{lang.label}</span>
            </div>
            {language === lang.id && <ShieldCheck size={20} />}
          </button>
        ))}
      </div>
    </motion.div>
  );
});

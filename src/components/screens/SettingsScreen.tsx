import React from 'react';
import { motion } from 'motion/react';
import { Menu, User, Globe, Moon, Download, ArrowRight, LogOut, Trophy } from 'lucide-react';
import { Screen } from '../../types';

interface SettingsScreenProps {
  t: (key: any) => string;
  setScreen: (s: Screen) => void;
  userProfile: any;
  language: string;
  setLanguage: (l: string) => void;
  theme: string;
  setTheme: (t: string) => void;
  handleLogout: () => void;
  handleDownloadData: () => void;
}

export const SettingsScreen = React.memo(({ 
  t, 
  setScreen, 
  userProfile, 
  language, 
  setLanguage, 
  theme, 
  setTheme, 
  handleLogout, 
  handleDownloadData 
}: SettingsScreenProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="min-h-screen p-6 pb-32"
    >
      <div className="flex items-center justify-between mb-10 pt-6">
        <h1 className="text-4xl font-bold font-display tracking-tight">{t('settings')}</h1>
        <button onClick={() => setScreen('home')} className="p-3 rounded-2xl glass-button">
          <Menu size={20} />
        </button>
      </div>

      <div className="space-y-8">
        {/* Profile Card */}
        <div className="p-8 rounded-[3rem] glass-card border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-emerald-500/10 blur-[80px] rounded-full" />
          <div className="relative flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] premium-gradient flex items-center justify-center shadow-2xl shadow-emerald-500/20">
              <User size={40} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold font-display tracking-tight">{userProfile?.full_name || 'Usuario'}</h3>
              <p className="text-white/40 text-sm font-medium">{userProfile?.email}</p>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Cuenta Activa</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="px-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">{t('preferences')}</div>
          <div className="p-2 rounded-[2.5rem] glass-card border-white/5 space-y-1">
            <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Globe size={20} />
                </div>
                <span className="font-bold tracking-tight">{t('language')}</span>
              </div>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-sm font-bold text-emerald-400 focus:outline-none cursor-pointer"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Moon size={20} />
                </div>
                <span className="font-bold tracking-tight">{t('theme')}</span>
              </div>
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="px-4 py-2 rounded-xl bg-white/5 text-xs font-bold hover:bg-white/10 transition-colors"
              >
                {theme === 'dark' ? 'Oscuro' : 'Claro'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="px-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">{t('data_management')}</div>
          <div className="p-2 rounded-[2.5rem] glass-card border-white/5 space-y-1">
            <button 
              onClick={handleDownloadData}
              className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Download size={20} />
                </div>
                <span className="font-bold tracking-tight">{t('download_data')}</span>
              </div>
              <ArrowRight size={18} className="text-white/10 group-hover:text-white/40 transition-all group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        <div className="pt-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 p-6 rounded-[2rem] bg-rose-500/10 text-rose-500 font-bold hover:bg-rose-500/20 transition-all active:scale-95"
          >
            <LogOut size={22} />
            {t('logout')}
          </button>
        </div>

        <div className="text-center space-y-2 opacity-20 py-8">
          <div className="text-[10px] font-bold uppercase tracking-[0.4em]">DeenSnap Intelligence</div>
          <div className="text-[10px] font-mono">Build 2024.12.01.PRO</div>
        </div>
      </div>
    </motion.div>
  );
});

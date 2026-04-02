import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Crown, Search, Scan, Map as MapIcon, ArrowRight, ShieldCheck, Zap, Trophy } from 'lucide-react';
import { Logo } from '../Logo';
import { cn } from '../../lib/utils';
import { Screen } from '../../types';

interface HomeScreenProps {
  t: (key: any) => string;
  setScreen: (s: Screen) => void;
  handleSearchByName: (name: string) => void;
  historyWithAlerts: any[];
  setCurrentProduct: (p: any) => void;
}

export const HomeScreen = React.memo(({ t, setScreen, handleSearchByName, historyWithAlerts, setCurrentProduct }: HomeScreenProps) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pb-32"
    >
      {/* Top Bar */}
      <header className="p-6 pt-12 flex justify-between items-center sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-lg">
        <Logo showText size={44} />
        <div className="flex items-center gap-3">
          <button className="p-2.5 rounded-xl glass-button relative group">
            <Bell size={20} className="group-hover:rotate-12 transition-transform" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#050505] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          </button>
          <button onClick={() => setScreen('premium')} className="p-2.5 rounded-xl glass-button text-gold-400 group">
            <Crown size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </header>

      <main className="p-6 space-y-10">
        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-0 bg-emerald-500/5 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative flex items-center">
            <Search className="absolute left-6 text-white/20 group-focus-within:text-emerald-400 transition-colors" size={20} />
            <input 
              ref={searchInputRef}
              type="text"
              placeholder={t('search_placeholder_name') || "Buscar producto por nombre..."}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchByName((e.target as HTMLInputElement).value);
                }
              }}
              className="w-full bg-white/[0.03] border border-white/5 rounded-[2rem] py-6 pl-16 pr-8 text-lg focus:outline-none focus:border-emerald-500/30 focus:bg-white/[0.05] transition-all placeholder:text-white/10"
            />
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-[3rem] p-10 glass-card border-white/10 group">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full group-hover:bg-emerald-500/30 transition-colors duration-700" />
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-4 border border-emerald-500/20">
                AI Powered Analysis
              </span>
              <h2 className="text-5xl font-bold font-display leading-[1] mb-6 tracking-tighter">
                {t('pureness')} <span className="text-emerald-400 italic">{t('scan')}</span>
              </h2>
              <p className="text-white/40 text-sm mb-10 max-w-[260px] leading-relaxed">
                {t('hero_desc')}
              </p>
              <button 
                onClick={() => setScreen('scanner')}
                className="w-full flex items-center justify-center gap-3 bg-white text-black px-8 py-5 rounded-[2rem] font-bold hover:scale-[1.02] transition-all active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
              >
                <Scan size={22} />
                {t('start_scan')}
              </button>
            </motion.div>
          </div>
        </section>

        {/* Bento Grid Features */}
        <div className="grid grid-cols-1 gap-4">
          <motion.div 
            onClick={() => setScreen('map')}
            whileHover={{ y: -5 }}
            className="p-8 rounded-[3rem] glass-card border-white/10 flex items-center justify-between group cursor-pointer overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <MapIcon size={80} className="text-emerald-400" />
            </div>
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <MapIcon size={32} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold font-display tracking-tight">{t('halal_map')}</div>
                <div className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">{t('discover')}</div>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <ArrowRight size={20} className="text-white/20 group-hover:text-emerald-400 transition-colors" />
            </div>
          </motion.div>
        </div>

        {/* Recent History Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">{t('recent_activity')}</h3>
            <button onClick={() => setScreen('history')} className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 hover:gap-2 transition-all">
              {t('view_all')} <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-4">
                {historyWithAlerts.length > 0 ? historyWithAlerts.slice(0, 5).map((item, i) => {
                  if (!item || !item.status) return null;
                  return (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + (i * 0.1) }}
                      onClick={() => {
                        setCurrentProduct(item);
                        setScreen('result');
                      }}
                      className="flex items-center justify-between p-5 rounded-[2rem] glass-card border-white/5 hover:bg-white/[0.06] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                          item.status === 'HALAL' ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 
                          item.status === 'HARAM' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                        )}>
                          {item.status === 'HALAL' ? <ShieldCheck size={24} /> : <Zap size={24} />}
                        </div>
                        <div>
                          <h4 className="font-bold text-base truncate max-w-[140px] tracking-tight">{item.name}</h4>
                          <p className="text-[10px] text-white/20 font-mono tracking-wider">{item.barcode}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest",
                        item.status === 'HALAL' ? 'bg-emerald-500/20 text-emerald-400' : 
                        item.status === 'HARAM' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                      )}>
                        {t(item.status.toLowerCase() as any)}
                      </div>
                    </motion.div>
                  );
                }) : (
              <div className="p-10 text-center rounded-[2rem] border-2 border-dashed border-white/5">
                <p className="text-white/20 text-sm font-medium">{t('no_scans')}</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </motion.div>
  );
});

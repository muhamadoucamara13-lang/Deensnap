import React from 'react';
import { Home, History, Scan, Crown, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { Screen } from '../types';

interface MobileNavProps {
  screen: Screen;
  setScreen: (s: Screen) => void;
}

export const MobileNav = React.memo(({ screen, setScreen }: MobileNavProps) => (
  <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[95%] max-w-md z-50 lg:hidden">
    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-2 flex items-center justify-between shadow-2xl">
      <button 
        onClick={() => setScreen('home')}
        className={cn(
          "flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all",
          screen === 'home' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-white/60 hover:text-white"
        )}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-medium">Home</span>
      </button>

      <button 
        onClick={() => setScreen('history')}
        className={cn(
          "flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all",
          screen === 'history' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-white/60 hover:text-white"
        )}
      >
        <History className="w-5 h-5" />
        <span className="text-[10px] font-medium">History</span>
      </button>

      <button 
        onClick={() => setScreen('scanner')}
        className="relative -top-8 w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 border-4 border-[#0A0A0A] transition-transform hover:scale-110 active:scale-95"
      >
        <Scan className="w-8 h-8 text-white" />
      </button>

      <button 
        onClick={() => setScreen('premium')}
        className={cn(
          "flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all",
          screen === 'premium' ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "text-white/60 hover:text-white"
        )}
      >
        <Crown className="w-5 h-5" />
        <span className="text-[10px] font-medium">Elite</span>
      </button>

      <button 
        onClick={() => setScreen('settings')}
        className={cn(
          "flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all",
          ['settings', 'profile_settings', 'language_settings', 'privacy_settings', 'support_settings', 'terms_settings', 'permissions_settings'].includes(screen) 
            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
            : "text-white/60 hover:text-white"
        )}
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10px] font-medium">Settings</span>
      </button>
    </div>
  </div>
));

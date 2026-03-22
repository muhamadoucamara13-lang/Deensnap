import { Menu, Scan, User, Clock, Map as MapIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { Screen } from '../types';

interface BottomNavProps {
  screen: Screen;
  setScreen: (screen: Screen) => void;
}

export function BottomNav({ screen, setScreen }: BottomNavProps) {
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[95%] max-w-md z-50 lg:hidden">
      <nav className="h-24 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[3rem] flex items-center justify-around px-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <button 
          onClick={() => setScreen('home')} 
          className={cn(
            "p-4 rounded-2xl transition-all duration-500", 
            screen === 'home' ? 'bg-white text-black shadow-xl' : 'text-white/30 hover:text-white'
          )}
        >
          <Menu size={24} />
        </button>
        <button 
          onClick={() => setScreen('history')} 
          className={cn(
            "p-4 rounded-2xl transition-all duration-500", 
            screen === 'history' ? 'bg-white text-black shadow-xl' : 'text-white/30 hover:text-white'
          )}
        >
          <Clock size={24} />
        </button>
        <button 
          onClick={() => setScreen('scanner')}
          className="w-20 h-20 -mt-16 rounded-full premium-gradient flex items-center justify-center shadow-[0_20px_40px_rgba(16,185,129,0.4)] border-[6px] border-[#050505] active:scale-90 transition-all duration-500 group"
        >
          <Scan size={32} className="text-white group-hover:scale-110 transition-transform" />
        </button>
        <button 
          onClick={() => setScreen('map')} 
          className={cn(
            "p-4 rounded-2xl transition-all duration-500", 
            screen === 'map' ? 'bg-white text-black shadow-xl' : 'text-white/30 hover:text-white'
          )}
        >
          <MapIcon size={24} />
        </button>
        <button 
          onClick={() => setScreen('settings')} 
          className={cn(
            "p-4 rounded-2xl transition-all duration-500", 
            screen === 'settings' ? 'bg-white text-black shadow-xl' : 'text-white/30 hover:text-white'
          )}
        >
          <User size={24} />
        </button>
      </nav>
    </div>
  );
}

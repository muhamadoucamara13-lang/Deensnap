import React from 'react';
import { motion } from 'motion/react';
import { Menu } from 'lucide-react';
import { Screen } from '../../types';
import { updateUserProfile } from '../../services/supabase';

interface ProfileSettingsScreenProps {
  t: (key: any) => string;
  setScreen: (s: Screen) => void;
  userProfile: any;
  setUserProfile: (p: any) => void;
  loading: boolean;
  setLoading: (l: boolean) => void;
  setLoadingMessage: (m: string) => void;
}

export const ProfileSettingsScreen = React.memo(({ 
  t, 
  setScreen, 
  userProfile, 
  setUserProfile, 
  loading, 
  setLoading, 
  setLoadingMessage 
}: ProfileSettingsScreenProps) => {
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
        <h1 className="text-3xl font-bold font-display tracking-tight">{t('profile')}</h1>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-1 h-4 bg-emerald-500 rounded-full" />
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">Información Personal</h4>
          </div>
          <div className="p-8 rounded-[2.5rem] glass-card border-white/5 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Nombre</label>
              <input 
                type="text"
                value={userProfile?.name || ''}
                onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500 transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Email</label>
              <input 
                type="email"
                value={userProfile?.email || ''}
                onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500 transition-all font-bold"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-1 h-4 bg-gold-500 rounded-full" />
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">Objetivos Nutricionales</h4>
          </div>
          <div className="p-8 rounded-[2.5rem] glass-card border-white/5 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Meta (Goal)</label>
              <input 
                type="text"
                placeholder="Ej: Perder peso, Ganar músculo..."
                value={userProfile?.goal || ''}
                onChange={(e) => setUserProfile({ ...userProfile, goal: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500 transition-all font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Calorías Diarias</label>
                <input 
                  type="number"
                  value={userProfile?.daily_calories_target || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, daily_calories_target: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Proteína (g)</label>
                <input 
                  type="number"
                  value={userProfile?.protein_target || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, protein_target: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Carbohidratos (g)</label>
                <input 
                  type="number"
                  value={userProfile?.carbs_target || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, carbs_target: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500 transition-all font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-1 h-4 bg-rose-500 rounded-full" />
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">Alertas de Ingredientes</h4>
          </div>
          <div className="p-8 rounded-[2.5rem] glass-card border-white/5 space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Mis Alertas (Ej: Aceite de palma, Gluten...)</label>
              <div className="flex flex-wrap gap-2">
                {(userProfile?.alerts || []).map((alert: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 bg-rose-500/10 text-rose-400 px-4 py-2 rounded-xl border border-rose-500/20">
                    <span className="font-bold text-sm">{alert}</span>
                    <button 
                      onClick={() => {
                        const newAlerts = [...(userProfile.alerts || [])];
                        newAlerts.splice(index, 1);
                        setUserProfile({ ...userProfile, alerts: newAlerts });
                      }}
                      className="hover:text-rose-200 transition-colors"
                    >
                      <Menu size={14} className="rotate-45" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Añadir ingrediente..."
                  id="new-alert-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      const val = input.value.trim();
                      if (val && !(userProfile?.alerts || []).includes(val)) {
                        setUserProfile({ 
                          ...userProfile, 
                          alerts: [...(userProfile?.alerts || []), val] 
                        });
                        input.value = '';
                      }
                    }
                  }}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-rose-500 transition-all font-bold"
                />
                <button 
                  onClick={() => {
                    const input = document.getElementById('new-alert-input') as HTMLInputElement;
                    const val = input.value.trim();
                    if (val && !(userProfile?.alerts || []).includes(val)) {
                      setUserProfile({ 
                        ...userProfile, 
                        alerts: [...(userProfile?.alerts || []), val] 
                      });
                      input.value = '';
                    }
                  }}
                  className="p-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
                >
                  <Menu size={20} />
                </button>
              </div>
              <p className="text-[10px] text-white/20 italic px-2">
                Si un producto contiene alguno de estos ingredientes, se marcará como "DUDOSO" automáticamente.
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={async () => {
            setLoading(true);
            setLoadingMessage(t('saving_profile') || "Guardando perfil...");
            await updateUserProfile(userProfile);
            setLoading(false);
            setScreen('settings');
          }}
          className="w-full py-6 rounded-[2rem] premium-gradient font-bold text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          {loading ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Guardar Cambios'}
        </button>
      </div>
    </motion.div>
  );
});

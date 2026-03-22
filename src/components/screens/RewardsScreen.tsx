import React from 'react';
import { motion } from 'motion/react';
import { Gift, Star, Trophy, ArrowRight, Zap, Crown } from 'lucide-react';
import { Screen } from '../../types';
import { UserProfile } from '../../services/supabase';

interface RewardsScreenProps {
  t: (key: any) => string;
  setScreen: (s: Screen) => void;
  userProfile: UserProfile | null;
  onRedeem: (rewardId: string, cost: number) => void;
}

export const RewardsScreen = React.memo(({ 
  t, 
  setScreen, 
  userProfile,
  onRedeem
}: RewardsScreenProps) => {
  const points = userProfile?.points || 0;

  const rewards = [
    {
      id: 'premium_1_week',
      title: '1 Semana Premium',
      description: 'Acceso total por 7 días',
      cost: 500,
      icon: <Zap size={24} className="text-emerald-400" />,
      color: 'emerald'
    },
    {
      id: 'premium_1_month',
      title: '1 Mes Premium',
      description: 'Acceso total por 30 días',
      cost: 1500,
      icon: <Crown size={24} className="text-gold-400" />,
      color: 'gold'
    },
    {
      id: 'premium_1_year',
      title: '1 Año Premium',
      description: 'Acceso total por 365 días',
      cost: 10000,
      icon: <Trophy size={24} className="text-indigo-400" />,
      color: 'indigo'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen p-6 pb-32 relative overflow-y-auto"
    >
      {/* Background Effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gold-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center animate-float shadow-[0_0_50px_rgba(16,185,129,0.2)] border border-emerald-500/20">
            <Trophy size={40} className="text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold font-display tracking-tighter">
              Premios y Recompensas
            </h1>
            <p className="text-white/40 text-sm font-medium max-w-xs mx-auto leading-relaxed">
              Gana puntos escaneando productos y canjéalos por beneficios exclusivos.
            </p>
          </div>
        </div>

        {/* Points Card */}
        <div className="p-8 rounded-[3rem] glass-card border-white/10 relative overflow-hidden bg-white/[0.02]">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Star size={80} className="text-emerald-400" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Tus Puntos</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold font-display tracking-tight text-emerald-400">{points}</span>
              <span className="text-sm font-bold text-white/20 uppercase tracking-widest">PTS</span>
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mb-1">Por Escaneo</p>
              <p className="text-sm font-bold text-white/60">+10 Puntos</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mb-1">Por Reportar</p>
              <p className="text-sm font-bold text-white/60">+50 Puntos</p>
            </div>
          </div>
        </div>

        {/* Rewards List */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-1 h-4 bg-emerald-500 rounded-full" />
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">Recompensas Disponibles</h4>
          </div>

          <div className="space-y-3">
            {rewards.map((reward) => (
              <motion.div
                key={reward.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`p-6 rounded-[2.5rem] glass-card border-white/5 flex items-center justify-between group cursor-pointer ${points < reward.cost ? 'opacity-50 grayscale' : ''}`}
                onClick={() => {
                  if (points >= reward.cost) {
                    onRedeem(reward.id, reward.cost);
                  }
                }}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl bg-${reward.color}-500/10 flex items-center justify-center shrink-0 border border-${reward.color}-500/20`}>
                    {reward.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight">{reward.title}</h3>
                    <p className="text-xs text-white/30 font-medium">{reward.description}</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-sm font-bold text-emerald-400">{reward.cost}</span>
                    <span className="text-[9px] text-white/20 font-bold ml-1 uppercase">PTS</span>
                  </div>
                  {points >= reward.cost && (
                    <div className="flex items-center gap-1 text-[9px] text-emerald-500 font-bold uppercase tracking-widest animate-pulse">
                      Canjear <ArrowRight size={10} />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Coupons Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-1 h-4 bg-rose-500 rounded-full" />
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">Cupones y Descuentos</h4>
          </div>

          <div className="p-8 rounded-[3rem] glass-card border-white/5 bg-rose-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Gift size={80} className="text-rose-400" />
            </div>
            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                  <Gift size={24} className="text-rose-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Descuentos Exclusivos</h3>
                  <p className="text-xs text-white/30 font-medium">Solo para usuarios Premium</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {[
                  { shop: 'Halal Market', discount: '15% OFF', code: 'DEENSNAP15' },
                  { shop: 'Organic Butcher', discount: '10% OFF', code: 'HALAL10' },
                ].map((coupon, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div>
                      <p className="text-sm font-bold">{coupon.shop}</p>
                      <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest">{coupon.discount}</p>
                    </div>
                    {userProfile?.plan === 'premium' ? (
                      <div className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 font-mono text-[10px] font-bold border border-rose-500/30">
                        {coupon.code}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] text-white/20 font-bold uppercase tracking-widest">
                        <Crown size={12} /> Bloqueado
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {userProfile?.plan !== 'premium' && (
                <button 
                  onClick={() => setScreen('premium')}
                  className="w-full py-4 rounded-2xl bg-rose-500/20 text-rose-400 font-bold text-sm hover:bg-rose-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Crown size={16} />
                  Desbloquear Cupones
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4">
          <button 
            onClick={() => setScreen('home')}
            className="w-full py-5 rounded-[2rem] bg-white/5 text-white/40 font-bold text-sm hover:bg-white/10 transition-all"
          >
            {t('back')}
          </button>
        </div>
      </div>
    </motion.div>
  );
});

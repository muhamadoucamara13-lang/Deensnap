import React from 'react';
import { motion } from 'motion/react';
import { Crown, Zap } from 'lucide-react';
import { Screen } from '../../types';

interface PremiumScreenProps {
  t: (key: any) => string;
  setScreen: (s: Screen) => void;
  handleCheckout: (plan: 'monthly' | 'yearly') => void;
  handlePortal: () => void;
  isPremium: boolean;
}

export const PremiumScreen = React.memo(({ 
  t, 
  setScreen, 
  handleCheckout,
  handlePortal,
  isPremium
}: PremiumScreenProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen p-6 pb-32 relative overflow-y-auto"
    >
      {/* Background Effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gold-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-24 h-24 rounded-[2.5rem] bg-gold-500/10 flex items-center justify-center animate-float shadow-[0_0_50px_rgba(245,158,11,0.2)] border border-gold-500/20">
            <Crown size={48} className="text-gold-400" />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold font-display tracking-tighter">
              {t('premium_title')}
            </h1>
            <p className="text-white/40 text-sm font-medium max-w-xs mx-auto leading-relaxed">
              {t('choose_plan')}
            </p>
          </div>
        </div>

        {/* Plans Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-8 rounded-[3rem] glass-card border-white/5 space-y-8 relative overflow-hidden"
          >
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight">{t('free_plan')}</h3>
              <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Básico</p>
            </div>
            
            <div className="space-y-4">
              {[
                t('free_feature_1'),
                t('free_feature_2'),
                t('free_feature_3'),
                t('free_feature_4')
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  </div>
                  <span className="text-xs text-white/40 font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <div className="text-2xl font-bold font-display tracking-tight opacity-40">0,00€</div>
              <div className="text-[10px] text-white/10 font-bold mt-1 uppercase tracking-widest">
                {!isPremium ? 'Plan Actual' : 'Básico'}
              </div>
            </div>
          </motion.div>

          {/* Premium Plan */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-8 rounded-[3rem] glass-card ${isPremium ? 'border-gold-500' : 'border-gold-500/20'} space-y-8 relative overflow-hidden bg-gold-500/[0.03]`}
          >
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Crown size={40} className="text-gold-400" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight text-gold-400">{t('premium_plan')}</h3>
              <p className="text-[10px] text-gold-500/40 font-black uppercase tracking-widest">Elite Experience</p>
            </div>
            
            <div className="space-y-4">
              {[
                t('premium_feature_unlimited'),
                t('premium_feature_fast_ai'),
                t('premium_feature_advanced'),
                t('premium_feature_history'),
                t('premium_feature_no_ads'),
                t('premium_feature_priority')
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-gold-500/10 flex items-center justify-center shrink-0">
                    <Zap size={10} className="text-gold-400" />
                  </div>
                  <span className="text-xs text-white/80 font-bold">{feature}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 space-y-4">
              <div className="text-2xl font-bold font-display tracking-tight text-gold-400">2,99€</div>
              <div className="text-[10px] text-gold-500/40 font-bold mt-1 uppercase tracking-widest">
                {isPremium ? 'Plan Actual' : 'Desde solo'}
              </div>
              
              {isPremium && (
                <button 
                  onClick={handlePortal}
                  className="w-full py-3 rounded-2xl bg-gold-500/10 border border-gold-500/30 text-gold-400 font-bold text-xs hover:bg-gold-500/20 transition-all"
                >
                  Gestionar Suscripción
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Pricing & CTA */}
        {!isPremium && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-3 px-2">
              <div className="w-1 h-4 bg-gold-500 rounded-full" />
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">Planes de Suscripción</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  console.log("App: Monthly plan clicked");
                  handleCheckout('monthly');
                }}
                className="p-8 rounded-[3rem] glass-card border-white/10 relative overflow-hidden group cursor-pointer hover:border-emerald-500/30 transition-all flex flex-col justify-between min-h-[320px]"
              >
                <div className="relative z-10">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">Plan Mensual</h3>
                    <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest mt-1">Flexibilidad Total</p>
                  </div>
                  <div className="mt-8">
                    <div className="text-3xl font-bold font-display tracking-tight">2,99€</div>
                    <div className="text-[10px] text-white/20 font-bold mt-1">por mes</div>
                  </div>
                </div>
                <button className="mt-8 w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-all relative z-10">
                  {t('premium_cta')}
                </button>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  console.log("App: Yearly plan clicked");
                  handleCheckout('yearly');
                }}
                className="p-8 rounded-[3rem] glass-card border-gold-500/20 relative overflow-hidden group cursor-pointer hover:border-gold-500/50 transition-all bg-gold-500/[0.02] flex flex-col justify-between min-h-[320px]"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                  <Crown size={60} className="text-gold-400" />
                </div>
                <div className="relative z-10">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">Elite Anual</h3>
                    <p className="text-[10px] text-gold-400/60 font-black uppercase tracking-widest mt-1">Mejor Valor</p>
                  </div>
                  <div className="mt-8">
                    <div className="text-3xl font-bold font-display tracking-tight">29,99€</div>
                    <div className="text-[10px] text-gold-400 font-bold mt-1">pago único anual</div>
                  </div>
                </div>
                <button className="mt-8 w-full py-4 rounded-2xl bg-gold-500 text-white font-bold text-sm shadow-lg shadow-gold-500/20 group-hover:scale-[1.02] transition-all relative z-10">
                  {t('premium_cta')}
                </button>
              </motion.div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {!isPremium && (
            <p className="text-center text-[10px] text-white/20 font-medium uppercase tracking-[0.2em]">
              Selecciona un plan para continuar
            </p>
          )}
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

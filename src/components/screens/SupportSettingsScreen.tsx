import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, Crown, Sparkles, MessageSquare, FileText, HelpCircle, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Screen } from '../../types';

interface SupportSettingsScreenProps {
  t: (key: any) => string;
  setScreen: (s: Screen) => void;
  isPremium: boolean;
  setShowChat: (s: boolean) => void;
  setShowTicketForm: (s: boolean) => void;
  setShowHelpCenter: (s: boolean) => void;
  openFaq: number | null;
  setOpenFaq: (i: number | null) => void;
}

export const SupportSettingsScreen = React.memo(({ 
  t, 
  setScreen, 
  isPremium, 
  setShowChat, 
  setShowTicketForm, 
  setShowHelpCenter, 
  openFaq, 
  setOpenFaq 
}: SupportSettingsScreenProps) => {
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
        <h1 className="text-3xl font-bold font-display tracking-tight">{t('support')}</h1>
      </div>

      <div className="space-y-6">
        <div className="p-8 rounded-[2.5rem] glass-card border-gold-500/20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gold-500/10 flex items-center justify-center mx-auto">
            <Crown size={32} className="text-gold-400" />
          </div>
          <h3 className="text-xl font-bold">
            {isPremium ? t('support_elite') : 'Soporte Estándar'}
          </h3>
          <p className="text-xs text-white/40 leading-relaxed">
            {isPremium ? t('data_protected') : 'Actualiza a Elite para soporte prioritario y chat en vivo.'}
          </p>
          {isPremium && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/20">
              <Sparkles size={12} className="text-gold-400" />
              <span className="text-[10px] font-bold text-gold-400 uppercase tracking-widest">{t('priority')}</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => setShowChat(true)}
            className="w-full flex items-center justify-between p-6 rounded-[2rem] glass-card border-white/5 hover:bg-emerald-500/10 transition-all group"
          >
            <div className="flex items-center gap-4">
              <MessageSquare size={22} className="text-emerald-400" />
              <span className="font-bold">{t('open_chat')}</span>
            </div>
            <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">LIVE</div>
          </button>

          <button 
            onClick={() => setShowTicketForm(true)}
            className="w-full flex items-center gap-4 p-6 rounded-[2rem] glass-card border-white/5 hover:bg-white/10 transition-all"
          >
            <FileText size={22} />
            <span className="font-bold">{t('send_ticket')}</span>
          </button>

          <button 
            onClick={() => setShowHelpCenter(true)}
            className="w-full flex items-center gap-4 p-6 rounded-[2rem] glass-card border-white/5 hover:bg-white/10 transition-all"
          >
            <HelpCircle size={22} />
            <span className="font-bold">{t('help_center')}</span>
          </button>
        </div>

        <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/20 mb-4">{t('faq_title')}</h4>
          <div className="space-y-4">
            {[
              { q: t('faq_q1'), a: t('faq_a1') },
              { q: t('faq_q2'), a: t('faq_a2') },
              { q: t('faq_q3'), a: t('faq_a3') }
            ].map((faq, i) => (
              <div key={i} className="space-y-2">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left text-sm font-medium text-white/60 hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span className={cn(openFaq === i && "text-emerald-400")}>{faq.q}</span>
                  <ChevronRight 
                    size={14} 
                    className={cn(
                      "transition-transform duration-300",
                      openFaq === i ? "rotate-90 text-emerald-400" : "text-white/20 group-hover:text-white/40"
                    )} 
                  />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="text-xs text-white/40 leading-relaxed pb-2">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

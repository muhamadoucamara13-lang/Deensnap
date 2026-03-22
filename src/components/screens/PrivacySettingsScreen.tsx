import React from 'react';
import { motion } from 'motion/react';
import { Menu, Lock, Shield, FileText, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Screen } from '../../types';
import { deleteUserHistory, deleteUserMeals } from '../../services/supabase';

interface PrivacySettingsScreenProps {
  t: (key: any) => string;
  setScreen: (s: Screen) => void;
  handleDownloadData: () => void;
  setConfirmModal: (m: any) => void;
  userProfile: any;
  setLoading: (l: boolean) => void;
  setLoadingMessage: (m: string) => void;
  setHistory: (h: any[]) => void;
  setMeals: (m: any[]) => void;
  permissions: any;
  requestPermission: (p: any) => void;
  handleDeleteAccount: () => void;
}

export const PrivacySettingsScreen = React.memo(({ 
  t, 
  setScreen, 
  handleDownloadData, 
  setConfirmModal, 
  userProfile, 
  setLoading, 
  setLoadingMessage, 
  setHistory, 
  setMeals, 
  permissions, 
  requestPermission, 
  handleDeleteAccount 
}: PrivacySettingsScreenProps) => {
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
        <h1 className="text-3xl font-bold font-display tracking-tight">{t('privacy')}</h1>
      </div>

      <div className="space-y-6">
        <div className="p-8 rounded-[2.5rem] glass-card border-emerald-500/20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
            <Lock size={32} className="text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold">{t('data_protected')}</h3>
          <p className="text-xs text-white/40 leading-relaxed">
            {t('privacy_intro')}
          </p>
        </div>

        <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <Shield size={14} /> {t('privacy_policy')}
            </h4>
            <div className="space-y-4 text-sm text-white/60 leading-relaxed">
              <p>{t('privacy_data_collected')}</p>
              <p>{t('privacy_usage')}</p>
              <p>{t('privacy_legal_basis')}</p>
              <p>{t('privacy_storage')}</p>
              <p>{t('privacy_transfers')}</p>
              <p>{t('privacy_minors')}</p>
              <p>{t('privacy_retention')}</p>
              <p>{t('privacy_sharing')}</p>
              <p>{t('privacy_cookies')}</p>
              <p>{t('privacy_rights')}</p>
              <p className="text-emerald-400 font-bold">{t('privacy_exercise')}</p>
              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{t('privacy_controller')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => setScreen('terms_settings')}
            className="w-full flex items-center gap-4 p-6 rounded-[2rem] glass-card border-white/5 hover:bg-white/10 transition-all"
          >
            <FileText size={22} className="text-white/40" />
            <span className="font-bold">{t('terms_conditions')}</span>
          </button>

          <button 
            onClick={handleDownloadData}
            className="w-full flex items-center gap-4 p-6 rounded-[2rem] glass-card border-white/5 hover:bg-emerald-500/10 transition-all"
          >
            <FileText size={22} className="text-emerald-400" />
            <span className="font-bold">{t('download_data')}</span>
          </button>

          <button 
            onClick={async () => {
              setConfirmModal({
                title: t('delete_history') || "Borrar Historial",
                message: t('delete_history') + "?",
                onConfirm: async () => {
                  if (userProfile?.id) {
                    setLoading(true);
                    setLoadingMessage(t('deleting_history') || "Borrando historial...");
                    await deleteUserHistory(userProfile.id);
                    await deleteUserMeals(userProfile.id);
                    setLoading(false);
                  }
                  setHistory([]);
                  setMeals([]);
                  setConfirmModal(null);
                }
              });
            }}
            className="w-full flex items-center gap-4 p-6 rounded-[2rem] glass-card border-white/5 hover:bg-rose-500/10 hover:text-rose-500 transition-all group"
          >
            <Trash2 size={22} />
            <span className="font-bold">{t('delete_history')}</span>
          </button>

          <button 
            onClick={() => setScreen('permissions_settings')}
            className="w-full flex items-center justify-between p-6 rounded-[2rem] glass-card border-white/5 hover:bg-white/10 transition-all group"
          >
            <div className="flex items-center gap-4">
              <ShieldCheck size={22} className="text-white/40 group-hover:text-white transition-colors" />
              <span className="font-bold">{t('manage_permissions')}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className={cn(
                "w-1 h-1 rounded-full animate-pulse",
                [permissions.camera, permissions.location, permissions.notifications].includes('granted') ? "bg-emerald-500" : "bg-rose-500"
              )} />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                {[permissions.camera === 'granted', permissions.location === 'granted', permissions.notifications === 'granted'].filter(Boolean).length}/3 {t('permission_granted')}
              </span>
            </div>
          </button>

          <button 
            onClick={handleDeleteAccount}
            className="w-full flex items-center gap-4 p-6 rounded-[2rem] border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
          >
            <AlertTriangle size={22} />
            <span className="font-bold">{t('delete_account')}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
});

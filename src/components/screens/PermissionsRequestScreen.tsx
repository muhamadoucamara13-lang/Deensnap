import React from 'react';
import { motion } from 'motion/react';
import { Menu, Camera, Navigation, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Screen } from '../../types';

interface PermissionsRequestScreenProps {
  t: (key: any) => string;
  setScreen: (s: Screen) => void;
  permissions: any;
  requestPermission: (p: any) => void;
  handleApplyPermissions: () => void;
}

export const PermissionsRequestScreen = React.memo(({ 
  t, 
  setScreen, 
  permissions, 
  requestPermission, 
  handleApplyPermissions 
}: PermissionsRequestScreenProps) => {
  return (
    <div className="fixed inset-0 bg-[#050505] flex items-center justify-center z-[100] p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md glass-card rounded-[3rem] border-white/10 p-10 space-y-10 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-6">
          <button onClick={() => setScreen('home')} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <Menu size={20} className="rotate-45" />
          </button>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold font-display tracking-tight text-emerald-400">{t('access_request')}</h2>
          <p className="text-sm text-white/40 font-medium leading-relaxed">
            {t('permissions_intro')}
          </p>
        </div>

        <div className="space-y-4">
          {[
            { id: 'camera', icon: Camera, label: t('permission_camera'), status: permissions.camera === 'granted' },
            { id: 'location', icon: Navigation, label: t('permission_location'), status: permissions.location === 'granted' }
          ].map((perm) => (
            <div key={perm.id} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  perm.status ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/20"
                )}>
                  <perm.icon size={20} />
                </div>
                <span className="font-bold text-sm">{perm.label}</span>
              </div>
              <div className={cn(
                "w-12 h-6 rounded-full p-1 transition-colors cursor-pointer",
                perm.status ? "bg-emerald-500" : "bg-white/10"
              )} onClick={() => requestPermission(perm.id as any)}>
                <div className={cn(
                  "w-4 h-4 rounded-full bg-white transition-transform",
                  perm.status ? "translate-x-6" : "translate-x-0"
                )} />
              </div>
            </div>
          ))}
        </div>

        {permissions.camera === 'denied' && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-left">
            <AlertTriangle className="text-rose-500 shrink-0" size={20} />
            <p className="text-xs text-rose-500 font-bold leading-tight">
              {t('camera_required')}
            </p>
          </div>
        )}

        <button 
          onClick={handleApplyPermissions}
          className="w-full py-5 rounded-2xl bg-white text-black font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
        >
          {permissions.camera === 'denied' ? t('retry') : t('apply')}
        </button>
      </motion.div>
    </div>
  );
});

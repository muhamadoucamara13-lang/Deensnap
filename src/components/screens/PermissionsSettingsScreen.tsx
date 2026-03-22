import React from 'react';
import { motion } from 'motion/react';
import { Menu, Camera, Navigation, Bell } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Screen } from '../../types';

interface PermissionsSettingsScreenProps {
  t: (key: any) => string;
  setScreen: (s: Screen) => void;
  permissions: any;
  requestPermission: (p: any) => void;
}

export const PermissionsSettingsScreen = React.memo(({ 
  t, 
  setScreen, 
  permissions, 
  requestPermission 
}: PermissionsSettingsScreenProps) => {
  const permsList = [
    { 
      id: 'camera', 
      icon: Camera, 
      label: t('permission_camera'), 
      desc: t('permission_camera_desc'), 
      status: permissions.camera === 'granted' 
    },
    { 
      id: 'location', 
      icon: Navigation, 
      label: t('permission_location'), 
      desc: t('permission_location_desc'), 
      status: permissions.location === 'granted' 
    },
    { 
      id: 'notifications', 
      icon: Bell, 
      label: t('permission_notifications'), 
      desc: t('permission_notifications_desc'), 
      status: permissions.notifications === 'granted' 
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen p-8"
    >
      <div className="flex items-center gap-4 mb-12 pt-6">
        <button onClick={() => setScreen('privacy_settings')} className="p-3 rounded-2xl glass-button">
          <Menu size={20} className="rotate-180" />
        </button>
        <h1 className="text-3xl font-bold font-display tracking-tight">{t('permissions_title')}</h1>
      </div>

      <div className="space-y-6">
        <p className="text-white/40 px-2">{t('permissions_desc')}</p>
        
        <div className="space-y-3">
          {permsList.map((perm) => (
            <div 
              key={perm.id}
              onClick={() => !perm.status && requestPermission(perm.id as any)}
              className={cn(
                "p-6 rounded-[2rem] glass-card border-white/5 flex items-center justify-between group transition-all",
                !perm.status && "cursor-pointer hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                  perm.status ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-white/20"
                )}>
                  <perm.icon size={22} />
                </div>
                <div>
                  <h4 className="font-bold tracking-tight">{perm.label}</h4>
                  <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">{perm.desc}</p>
                </div>
              </div>
              <div className={cn(
                "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                perm.status 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : "bg-rose-500/10 text-rose-500 border-rose-500/20"
              )}>
                {perm.status ? t('permission_granted') : t('permission_denied')}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5">
          <p className="text-xs text-white/40 leading-relaxed text-center">
            Para cambiar estos permisos, por favor dirígete a los ajustes de tu sistema operativo.
          </p>
        </div>

        <button 
          onClick={() => setScreen('privacy_settings')}
          className="w-full py-6 rounded-[2rem] bg-white text-black font-bold hover:scale-[1.02] active:scale-95 transition-all"
        >
          {t('back')}
        </button>
      </div>
    </motion.div>
  );
});

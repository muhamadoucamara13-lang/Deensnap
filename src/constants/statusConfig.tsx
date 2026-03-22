import { ShieldCheck, AlertTriangle, Clock } from 'lucide-react';

export const statusConfig = {
  HALAL: {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    icon: ShieldCheck,
  },
  HARAM: {
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    icon: AlertTriangle,
  },
  DUDOSO: {
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    icon: Clock,
  }
};

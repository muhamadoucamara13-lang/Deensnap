import React from 'react';
import { motion } from 'motion/react';
import { Trash2, Menu, Search, X, Clock, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Screen } from '../../types';
import { statusConfig } from '../../constants/statusConfig';
import { getSavedProduct } from '../../services/supabase';

interface HistoryScreenProps {
  t: (key: any) => string;
  setScreen: (s: Screen) => void;
  history: any[];
  handleClearHistory: () => void;
  historySearchQuery: string;
  setHistorySearchQuery: (s: string) => void;
  historyStatusFilter: string;
  setHistoryStatusFilter: (s: any) => void;
  historyStartDateFilter: string;
  setHistoryStartDateFilter: (s: string) => void;
  historyEndDateFilter: string;
  setHistoryEndDateFilter: (s: string) => void;
  historySortBy: string;
  setHistorySortBy: (s: any) => void;
  historySortOrder: string;
  setHistorySortOrder: (f: (prev: any) => any) => void;
  filteredHistory: any[];
  setLoading: (l: boolean) => void;
  setLoadingMessage: (m: string) => void;
  setCurrentProduct: (p: any) => void;
  handleDeleteHistoryEntry: (barcode: string, scannedAt: string) => void;
}

export const HistoryScreen = React.memo(({ 
  t, 
  setScreen, 
  history, 
  handleClearHistory, 
  historySearchQuery, 
  setHistorySearchQuery, 
  historyStatusFilter, 
  setHistoryStatusFilter, 
  historyStartDateFilter, 
  setHistoryStartDateFilter, 
  historyEndDateFilter, 
  setHistoryEndDateFilter, 
  historySortBy, 
  setHistorySortBy, 
  historySortOrder, 
  setHistorySortOrder, 
  filteredHistory, 
  setLoading, 
  setLoadingMessage, 
  setCurrentProduct, 
  handleDeleteHistoryEntry 
}: HistoryScreenProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen p-6 pb-32"
    >
      <div className="flex items-center justify-between mb-8 pt-6">
        <h1 className="text-4xl font-bold font-display tracking-tight">{t('history')}</h1>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button 
              onClick={handleClearHistory}
              className="p-3 rounded-2xl glass-button text-rose-500 hover:bg-rose-500/10 transition-colors"
              title={t('delete_history')}
            >
              <Trash2 size={20} />
            </button>
          )}
          <button onClick={() => setScreen('home')} className="p-3 rounded-2xl glass-button">
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Filtros de Historial */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input 
            type="text"
            placeholder={t('search_history_placeholder')}
            value={historySearchQuery}
            onChange={(e) => setHistorySearchQuery(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
          />
          {historySearchQuery && (
            <button 
              onClick={() => setHistorySearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {(['ALL', 'HALAL', 'HARAM', 'DUDOSO'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setHistoryStatusFilter(status)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                historyStatusFilter === status 
                  ? "bg-white text-black border-white" 
                  : "bg-white/5 text-white/40 border-white/5 hover:border-white/20"
              )}
            >
              {status === 'ALL' ? 'Todos' : status}
            </button>
          ))}
          <div className="flex items-center gap-2">
            <input 
              type="date"
              value={historyStartDateFilter}
              onChange={(e) => setHistoryStartDateFilter(e.target.value)}
              className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs text-white/40 focus:outline-none focus:border-white/20"
              title="Fecha Inicio"
            />
            <span className="text-white/20 text-xs">-</span>
            <input 
              type="date"
              value={historyEndDateFilter}
              onChange={(e) => setHistoryEndDateFilter(e.target.value)}
              className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs text-white/40 focus:outline-none focus:border-white/20"
              title="Fecha Fin"
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <select 
              value={historySortBy}
              onChange={(e) => setHistorySortBy(e.target.value as any)}
              className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/40 focus:outline-none"
            >
              <option value="date">{t('sort_date')}</option>
              <option value="name">{t('sort_name')}</option>
              <option value="status">{t('sort_status')}</option>
              <option value="ingredients">{t('sort_ingredients')}</option>
            </select>
            <button 
              onClick={() => setHistorySortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="text-[10px] font-bold uppercase tracking-widest text-emerald-400"
            >
              {historySortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
            {filteredHistory.length} resultados
            {(historySearchQuery || historyStartDateFilter || historyEndDateFilter || historyStatusFilter !== 'ALL') && (
              <button 
                onClick={() => {
                  setHistorySearchQuery('');
                  setHistoryStatusFilter('ALL');
                  setHistoryStartDateFilter('');
                  setHistoryEndDateFilter('');
                }}
                className="ml-2 text-emerald-400 hover:underline"
              >
                Limpiar
              </button>
            )}
          </span>
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredHistory.length > 0 ? filteredHistory.map((item, i) => {
          const config = (statusConfig as any)[item.status] || {
            color: 'text-white/40',
            bgColor: 'bg-white/5',
            icon: Clock
          };
          const StatusIcon = config.icon;
          
          return (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={async () => {
                setLoading(true);
                setLoadingMessage(t('loading_history') || "Cargando historial...");
                const prod = await getSavedProduct(item.product_barcode);
                if (prod) {
                  setCurrentProduct(prod as any);
                  setScreen('result');
                }
                setLoading(false);
              }}
              className="p-6 rounded-[2.5rem] glass-card border-white/5 flex items-center justify-between group hover:bg-white/[0.06] transition-all cursor-pointer relative overflow-hidden"
            >
              <div 
                className="flex-1 flex items-center gap-5"
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                  config.bgColor
                )}>
                  <StatusIcon size={24} className={config.color} />
                </div>
                <div>
                  <h4 className="font-bold text-base tracking-tight truncate max-w-[180px]">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("text-[10px] font-black tracking-widest px-2 py-0.5 rounded bg-black/20", config.color)}>
                      {item.status}
                    </span>
                    <span className="text-[10px] text-white/20 font-medium">
                      {item.scanned_at ? new Date(item.scanned_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '---'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteHistoryEntry(item.product_barcode, item.scanned_at);
                  }}
                  className="p-3 rounded-xl hover:bg-rose-500/10 text-white/10 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
                <div className="p-2 rounded-full bg-white/5 text-white/20 group-hover:text-white/40 transition-colors">
                  <ArrowRight size={20} />
                </div>
              </div>
            </motion.div>
          );
        }) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <Clock size={64} className="mb-4" />
            <p className="font-medium">
              {historySearchQuery || historyStartDateFilter || historyEndDateFilter || historyStatusFilter !== 'ALL' 
                ? t('no_results_found') 
                : t('no_scans')}
            </p>
          </div>
        )}
      </div>
      
    </motion.div>
  );
});

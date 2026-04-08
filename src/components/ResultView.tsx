import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  Info, 
  ArrowLeft, 
  Share2,
  ExternalLink,
  ChevronRight,
  Shield,
  X,
  Globe,
  Utensils,
  Heart
} from 'lucide-react';
import { ProductData } from '../services/openFoodFacts';
import { AnalysisResult, explainIngredient } from '../services/gemini';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { logMeal, toggleFavorite, isFavorite as checkIsFavorite } from '../services/supabase';

interface ResultViewProps {
  product: ProductData & Partial<AnalysisResult>;
  onBack: () => void;
  userProfile?: any;
}

export function ResultView({ product, onBack, userProfile }: ResultViewProps) {
  const { t, language } = useLanguage();
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);
  const [ingredientInfo, setIngredientInfo] = useState<string | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [isLoggingMeal, setIsLoggingMeal] = useState(false);
  const [mealLogged, setMealLogged] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [isTogglingFav, setIsTogglingFav] = useState(false);

  useEffect(() => {
    const checkFav = async () => {
      if (userProfile?.id && product.barcode) {
        const fav = await checkIsFavorite(userProfile.id, product.barcode);
        setIsFav(fav);
      }
    };
    checkFav();
  }, [userProfile?.id, product.barcode]);

  const handleToggleFavorite = async () => {
    if (!userProfile?.id || isTogglingFav) return;
    setIsTogglingFav(true);
    try {
      await toggleFavorite({
        user_id: userProfile.id,
        barcode: product.barcode
      });
      setIsFav(!isFav);
    } catch (err) {
      console.error("Error toggling favorite:", err);
    } finally {
      setIsTogglingFav(false);
    }
  };

  // Apply personal alerts to the product status for display
  const userAlerts = userProfile?.alerts || [];
  const ingredientsText = product.ingredients || "";
  const foundAlerts = userAlerts.filter((alert: string) => 
    ingredientsText.toLowerCase().includes(alert.toLowerCase())
  );

  const getDisplayStatus = (): "HALAL" | "DUDOSO" | "HARAM" | undefined => {
    const status = product.status as any;
    if (foundAlerts.length > 0 && status === 'HALAL') {
      return 'DUDOSO';
    }
    return status;
  };

  const displayStatus = getDisplayStatus();
  
  const displayReason = (foundAlerts.length > 0 && product.status === 'HALAL')
    ? `${t('doubtful')}: ${foundAlerts.join(', ')}. ${product.reason || ''}`
    : product.reason;

  const isHalal = String(displayStatus) === 'HALAL';
  const isHaram = String(displayStatus) === 'HARAM';
  const isMushbooh = String(displayStatus) === 'DUDOSO';

  const fetchIngredientDetails = async (ingredient: string) => {
    setSelectedIngredient(ingredient);
    setLoadingInfo(true);
    setIngredientInfo(null);
    
    try {
      const info = await explainIngredient(ingredient, language);
      setIngredientInfo(info);
    } catch (error) {
      console.error("Error fetching ingredient details:", error);
      setIngredientInfo("Error al cargar la información. Por favor, inténtalo de nuevo.");
    } finally {
      setLoadingInfo(false);
    }
  };

  const configs = {
    HALAL: {
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      glowColor: 'shadow-emerald-500/20',
      label: t('halal'),
      description: t('halal_desc')
    },
    HARAM: {
      icon: XCircle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      glowColor: 'shadow-rose-500/20',
      label: t('haram'),
      description: t('haram_desc')
    },
    DUDOSO: {
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      glowColor: 'shadow-amber-500/20',
      label: t('doubtful'),
      description: t('doubtful_desc')
    }
  };

  const statusConfig = configs[(displayStatus as keyof typeof configs) || 'DUDOSO'];

  const handleShare = async () => {
    let shareText = `DeenSnap: ${t('analysis_report')} - ${product.name}\n`;
    shareText += `--------------------------------\n`;
    shareText += `${t('status')}: ${statusConfig.label}\n`;
    shareText += `${t('reason')}: ${displayReason || statusConfig.description}\n`;
    
    if (product.risk_ingredients && product.risk_ingredients.length > 0) {
      shareText += `\n⚠️ ${t('risk_ingredients')}:\n- ${product.risk_ingredients.join('\n- ')}\n`;
    }
    
    if (product.certification) {
      shareText += `\n✅ ${t('official_certification')}: ${product.certification.certifier}\n`;
    }
    
    shareText += `\n🔗 ${window.location.origin}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `DeenSnap: ${product.name}`,
          text: shareText,
          url: window.location.origin,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert(t('copied_to_clipboard'));
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleLogMeal = async () => {
    if (!userProfile?.id || isLoggingMeal) return;
    
    setIsLoggingMeal(true);
    try {
      await logMeal({
        user_id: userProfile.id,
        barcode: product.barcode,
        product_name: product.name,
        calories: product.nutriments?.energy_100g,
        proteins: product.nutriments?.proteins_100g,
        fat: product.nutriments?.fat_100g,
        carbs: product.nutriments?.carbohydrates_100g
      });
      setMealLogged(true);
      setTimeout(() => setMealLogged(false), 3000);
    } catch (err) {
      console.error("Error logging meal:", err);
    } finally {
      setIsLoggingMeal(false);
    }
  };

  const Icon = statusConfig.icon;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#050505] pb-20 relative"
    >
      <div className="noise-overlay" />
      
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between p-8 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
        <button 
          onClick={onBack}
          className="p-3 rounded-2xl glass-button text-white/40 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-1">{t('analysis_report')}</span>
          <span className="font-display font-bold text-sm tracking-tight">ID: {product.barcode?.slice(-6)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleToggleFavorite}
            disabled={isTogglingFav}
            className={cn(
              "p-3 rounded-2xl glass-button transition-all",
              isFav ? "text-rose-500 bg-rose-500/10" : "text-white/40 hover:text-white"
            )}
          >
            <Heart size={20} fill={isFav ? "currentColor" : "none"} />
          </button>
          <button 
            onClick={handleShare}
            className="p-3 rounded-2xl glass-button text-white/40 hover:text-white active:scale-90 transition-all"
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <div className="p-8 space-y-10 relative z-10">
        {/* Status Card */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "rounded-[3rem] p-10 text-center border-2 relative overflow-hidden",
            statusConfig.bgColor,
            statusConfig.borderColor,
            "shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          )}
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className={cn("inline-flex p-6 rounded-[2rem] mb-8", statusConfig.bgColor, "shadow-2xl", statusConfig.glowColor)}
          >
            <Icon size={56} className={statusConfig.color} />
          </motion.div>
          
          <h2 className={cn("text-4xl font-bold mb-4 font-display tracking-tighter", statusConfig.color)}>
            {statusConfig.label}
          </h2>
          <p className="text-white/50 text-sm leading-relaxed max-w-md mx-auto font-medium">
            {displayReason || statusConfig.description}
          </p>

          {foundAlerts.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center justify-center gap-2"
            >
              <AlertTriangle size={16} />
              <span>{t('alert') || 'ALERTA'}: Contiene {foundAlerts.join(', ')}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Product Details */}
        <div className="flex items-center gap-6 p-2">
          <div className="relative group">
            {product.image_url ? (
              <div className="relative">
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-24 h-24 rounded-[2rem] object-cover border border-white/10 shadow-2xl relative z-10"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full scale-75 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-[2rem] glass-card flex items-center justify-center border-white/5">
                <Shield size={32} className="text-white/10" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-bold font-display tracking-tight truncate">{product.name}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/20 bg-white/5 px-2 py-1 rounded-md">Barcode</span>
              <span className="text-xs text-white/40 font-mono tracking-tighter">{product.barcode}</span>
            </div>
          </div>
        </div>

        {/* Risk Ingredients */}
        {product.risk_ingredients && product.risk_ingredients.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-1 h-4 bg-rose-500 rounded-full" />
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">{t('risk_ingredients')}</h4>
            </div>
            <div className="space-y-3">
              {product.risk_ingredients.map((ing, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                  key={i}
                  className="flex items-center justify-between p-5 rounded-[2rem] glass-card border-white/5 group hover:bg-white/[0.06] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                      <AlertTriangle size={18} className="text-rose-400" />
                    </div>
                    <span className="font-bold tracking-tight">{ing}</span>
                  </div>
                  <button 
                    onClick={() => fetchIngredientDetails(ing)}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <Info size={16} className="text-white/20" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Full Ingredients */}
        <div className="p-8 rounded-[2.5rem] glass-card border-white/5 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none">
            <Shield size={120} />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">{t('full_composition')}</h4>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Verified by IA</span>
            </div>
          </div>
          <p className="text-sm text-white/50 leading-relaxed italic font-medium relative z-10">
            "{product.ingredients}"
          </p>
        </div>

        {/* Nutritional Facts */}
        {product.nutriments && (
          <div className="p-8 rounded-[2.5rem] glass-card border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">{t('nutritional_facts')}</h4>
              </div>
              <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{t('per_100g')}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: t('energy'), value: product.nutriments.energy_100g ? `${Math.round(product.nutriments.energy_100g)} kcal` : '---' },
                { label: t('proteins'), value: product.nutriments.proteins_100g ? `${product.nutriments.proteins_100g.toFixed(1)}g` : '---' },
                { label: t('fat'), value: product.nutriments.fat_100g ? `${product.nutriments.fat_100g.toFixed(1)}g` : '---' },
                { label: t('saturated_fat'), value: product.nutriments.saturated_fat_100g ? `${product.nutriments.saturated_fat_100g.toFixed(1)}g` : '---' },
                { label: t('carbohydrates'), value: product.nutriments.carbohydrates_100g ? `${product.nutriments.carbohydrates_100g.toFixed(1)}g` : '---' },
                { label: t('sugars'), value: product.nutriments.sugars_100g ? `${product.nutriments.sugars_100g.toFixed(1)}g` : '---' },
                { label: t('salt'), value: product.nutriments.salt_100g ? `${product.nutriments.salt_100g.toFixed(2)}g` : '---' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-lg font-bold font-display">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications Section */}
        {product.certification && (
          <div className="p-8 rounded-[2.5rem] glass-card border-emerald-500/20 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none text-emerald-500">
              <ShieldCheck size={120} />
            </div>
            <div className="flex items-center gap-3 px-2">
              <div className="w-1 h-4 bg-emerald-500 rounded-full" />
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">{t('official_certification')}</h4>
            </div>
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden">
                {product.certification.logo ? (
                  <img 
                    src={product.certification.logo} 
                    alt="Halal Logo" 
                    className="w-full h-full object-contain p-2"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <ShieldCheck size={40} className="text-emerald-400" />
                )}
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-lg tracking-tight leading-tight mb-1">{product.certification.certifier}</h5>
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={12} className="text-white/40" />
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{product.certification.country}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                    product.certification.reliability === 'alta' 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                      : product.certification.reliability === 'media'
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  )}>
                    Fiabilidad {product.certification.reliability}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alternatives Section (Premium) */}
        {product.status !== 'HALAL' && product.alternatives && product.alternatives.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-1 h-4 bg-gold-500 rounded-full" />
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">{t('halal_alternatives')}</h4>
            </div>
            <div className="space-y-3">
              {product.alternatives.map((alt, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + (i * 0.1) }}
                  key={i}
                  className="flex items-center justify-between p-5 rounded-[2rem] glass-card border-gold-500/10 group hover:bg-white/[0.06] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center">
                      <ShieldCheck size={18} className="text-gold-400" />
                    </div>
                    <span className="font-bold tracking-tight">{alt}</span>
                  </div>
                  <ChevronRight size={16} className="text-white/20" />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Action Footer */}
        <div className="pt-6 space-y-4">
          {userProfile && (
            <button 
              onClick={handleLogMeal}
              disabled={isLoggingMeal || mealLogged}
              className={cn(
                "w-full py-6 rounded-[2rem] font-bold text-lg shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all",
                mealLogged 
                  ? "bg-emerald-500 text-white" 
                  : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
              )}
            >
              {isLoggingMeal ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : mealLogged ? (
                <>
                  <ShieldCheck size={20} />
                  ¡Comida Registrada!
                </>
              ) : (
                <>
                  <Utensils size={20} />
                  Registrar como Comida
                </>
              )}
            </button>
          )}
          
          <a 
            href={`https://www.google.com/search?q=${encodeURIComponent(product.name + ' halal certification')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-6 rounded-[2rem] premium-gradient font-bold text-lg shadow-[0_20px_40px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 group active:scale-95 transition-all"
          >
            {t('view_certification')}
            <ExternalLink size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </a>

          <button 
            onClick={handleShare}
            className="w-full py-4 rounded-[2rem] bg-white/5 border border-white/5 text-white/40 hover:text-white/60 font-bold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <Share2 size={16} />
            Compartir Análisis
          </button>
        </div>
      </div>

      {/* Ingredient Detail Modal */}
      <AnimatePresence>
        {selectedIngredient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedIngredient(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm glass-card border-white/10 rounded-[3rem] p-8 space-y-6 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <button 
                  onClick={() => setSelectedIngredient(null)}
                  className="p-2 rounded-xl hover:bg-white/5 text-white/20 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                  <AlertTriangle size={24} className="text-rose-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">{selectedIngredient}</h3>
                  <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest">{t('risk_analysis')}</p>
                </div>
              </div>

              <div className="space-y-4">
                {loadingInfo ? (
                  <div className="space-y-3 py-4">
                    <div className="h-4 bg-white/5 rounded-full animate-pulse w-full" />
                    <div className="h-4 bg-white/5 rounded-full animate-pulse w-[90%]" />
                    <div className="h-4 bg-white/5 rounded-full animate-pulse w-[80%]" />
                  </div>
                ) : (
                  <p className="text-sm text-white/60 leading-relaxed font-medium">
                    {ingredientInfo}
                  </p>
                )}
              </div>

              <button 
                onClick={() => setSelectedIngredient(null)}
                className="w-full py-4 rounded-2xl bg-white text-black font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all"
              >
                {t('understood')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

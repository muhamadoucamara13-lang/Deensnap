import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scan, 
  History, 
  Settings, 
  Search,
  Crown,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Clock,
  Menu,
  Bell,
  Home,
  Map as MapIcon,
  User,
  LogOut,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  AlertTriangle,
  Globe,
  HelpCircle,
  MessageSquare,
  FileText,
  Trash2,
  Lock,
  Camera,
  Navigation,
  X,
  Heart,
  Utensils,
  Palette
} from 'lucide-react';
import { Logo } from './components/Logo';
import { Scanner } from './components/Scanner';
import { ResultView } from './components/ResultView';
import { MapScreen } from './components/MapScreen';
import { Auth } from './components/Auth';
import { MobileNav } from './components/MobileNav';
import { HomeScreen } from './components/screens/HomeScreen';
import { HistoryScreen } from './components/screens/HistoryScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { PremiumScreen } from './components/screens/PremiumScreen';
import { FavoritesScreen } from './components/screens/FavoritesScreen';
import { MealsScreen } from './components/screens/MealsScreen';
import { ProfileSettingsScreen } from './components/screens/ProfileSettingsScreen';
import { LanguageSettingsScreen } from './components/screens/LanguageSettingsScreen';
import { PrivacySettingsScreen } from './components/screens/PrivacySettingsScreen';
import { TermsSettingsScreen } from './components/screens/TermsSettingsScreen';
import { PermissionsSettingsScreen } from './components/screens/PermissionsSettingsScreen';
import { PermissionsRequestScreen } from './components/screens/PermissionsRequestScreen';
import { SupportSettingsScreen } from './components/screens/SupportSettingsScreen';
import { fetchProductFromOFF, ProductData } from './services/openFoodFacts';
import { analyzeIngredients, AnalysisResult, searchProductByBarcode, searchProductByName } from './services/gemini';
import { 
  getSavedProduct, 
  saveProduct, 
  supabase, 
  getUserProfile, 
  updateUserProfile,
  savePrivacySettings,
  getPrivacySettings,
  reportMissingProduct,
  getUserFavorites,
  getUserMeals,
  deleteUserHistory,
  deleteHistoryEntry,
  deleteUserMeals,
  saveScanToHistory,
  loadHistory,
  deleteUserAccount
} from './services/supabase';
import { cn } from './lib/utils';
import { useLanguage } from './contexts/LanguageContext';
import { useTheme } from './contexts/ThemeContext';
import { translations } from './constants/translations';

import { statusConfig } from './constants/statusConfig';
import { Screen } from './types';






export default function App() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [screen, setScreen] = useState<Screen>('home');
  const [hasAcceptedPermissions, setHasAcceptedPermissions] = useState<boolean>(() => {
    return localStorage.getItem('deensnap_permissions_accepted') === 'true';
  });
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [currentProduct, setCurrentProduct] = useState<(ProductData & Partial<AnalysisResult>) | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [isAppLoaded, setIsAppLoaded] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userAlerts, setUserAlerts] = useState<string[]>(['E471', 'Gelatina', 'Alcohol']);
  const [isAddingAlert, setIsAddingAlert] = useState(false);
  const [newAlertInput, setNewAlertInput] = useState('');
  const [permissions, setPermissions] = useState<{
    camera: PermissionState | 'unknown';
    location: PermissionState | 'unknown';
    notifications: NotificationPermission | 'unknown';
  }>({
    camera: 'unknown',
    location: 'unknown',
    notifications: 'unknown'
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [dailyScans, setDailyScans] = useState(0);
  const isPremium = userProfile?.is_premium === true || userProfile?.plan === 'premium';
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ text: string, sender: 'user' | 'ai', time: string }[]>([]);
  const [session, setSession] = useState<any>(null);
  
  // History Filters Persistence
  const [historySearchQuery, setHistorySearchQuery] = useState(() => localStorage.getItem('deensnap_history_search') || '');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'ALL' | 'HALAL' | 'HARAM' | 'DUDOSO'>(() => (localStorage.getItem('deensnap_history_status') as any) || 'ALL');
  const [historyStartDateFilter, setHistoryStartDateFilter] = useState(() => localStorage.getItem('deensnap_history_start_date') || '');
  const [historyEndDateFilter, setHistoryEndDateFilter] = useState(() => localStorage.getItem('deensnap_history_end_date') || '');
  const [historyIngredientsFilter, setHistoryIngredientsFilter] = useState(() => localStorage.getItem('deensnap_history_ingredients') || '');
  const [historySortBy, setHistorySortBy] = useState<'date' | 'name' | 'status' | 'ingredients'>(() => (localStorage.getItem('deensnap_history_sort_by') as any) || 'date');
  const [historySortOrder, setHistorySortOrder] = useState<'asc' | 'desc'>(() => (localStorage.getItem('deensnap_history_sort_order') as any) || 'desc');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync History Filters to localStorage
  useEffect(() => {
    localStorage.setItem('deensnap_history_search', historySearchQuery);
  }, [historySearchQuery]);

  useEffect(() => {
    localStorage.setItem('deensnap_history_status', historyStatusFilter);
  }, [historyStatusFilter]);

  useEffect(() => {
    localStorage.setItem('deensnap_history_start_date', historyStartDateFilter);
  }, [historyStartDateFilter]);

  useEffect(() => {
    localStorage.setItem('deensnap_history_end_date', historyEndDateFilter);
  }, [historyEndDateFilter]);

  useEffect(() => {
    localStorage.setItem('deensnap_history_ingredients', historyIngredientsFilter);
  }, [historyIngredientsFilter]);

  useEffect(() => {
    localStorage.setItem('deensnap_history_sort_by', historySortBy);
  }, [historySortBy]);

  useEffect(() => {
    localStorage.setItem('deensnap_history_sort_order', historySortOrder);
  }, [historySortOrder]);

  // Validate History Date Range: Start date cannot be after end date
  useEffect(() => {
    if (historyStartDateFilter && historyEndDateFilter) {
      const start = new Date(historyStartDateFilter);
      const end = new Date(historyEndDateFilter);
      if (start > end) {
        setHistoryEndDateFilter(historyStartDateFilter);
      }
    }
  }, [historyStartDateFilter, historyEndDateFilter]);

  useEffect(() => {
    if (showChat && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, showChat]);

  const historyWithAlerts = useMemo(() => {
    return history.map(item => {
      // Apply personal alerts to history items for consistent display
      const foundAlerts = userAlerts.filter(alert => 
        (item.ingredients || "").toLowerCase().includes(alert.toLowerCase())
      );
      
      if (foundAlerts.length > 0 && item.status === 'HALAL') {
        return {
          ...item,
          status: 'DUDOSO',
          reason: `${t('doubtful')}: ${foundAlerts.join(', ')}. ${item.reason || ''}`
        };
      }
      return item;
    });
  }, [history, userAlerts, t]);

  const favoritesWithAlerts = useMemo(() => {
    return favorites.map(item => {
      // Apply personal alerts to favorites for consistent display
      const foundAlerts = userAlerts.filter(alert => 
        (item.ingredients || "").toLowerCase().includes(alert.toLowerCase())
      );
      
      if (foundAlerts.length > 0 && item.status === 'HALAL') {
        return {
          ...item,
          status: 'DUDOSO',
          reason: `${t('doubtful')}: ${foundAlerts.join(', ')}. ${item.reason || ''}`
        };
      }
      return item;
    });
  }, [favorites, userAlerts, t]);

  const filteredHistory = useMemo(() => {
    return historyWithAlerts
      .filter(item => {
        const ingredientsText = Array.isArray(item.ingredients) ? item.ingredients.join(', ') : (item.ingredients || "");
        const matchesSearch = !historySearchQuery || 
          (item.name && item.name.toLowerCase().includes(historySearchQuery.toLowerCase())) ||
          (item.product_barcode && item.product_barcode.includes(historySearchQuery)) ||
          (ingredientsText.toLowerCase().includes(historySearchQuery.toLowerCase()));
        
        const matchesStatus = historyStatusFilter === 'ALL' || item.status === historyStatusFilter;
        
        const matchesIngredients = !historyIngredientsFilter || 
          (ingredientsText.toLowerCase().includes(historyIngredientsFilter.toLowerCase()));
        
        const itemDate = item.scanned_at ? new Date(item.scanned_at).getTime() : 0;
        const startDate = historyStartDateFilter ? new Date(historyStartDateFilter).getTime() : 0;
        const endDate = historyEndDateFilter ? new Date(historyEndDateFilter).setHours(23, 59, 59, 999) : Infinity;
        
        const matchesDate = itemDate >= startDate && itemDate <= endDate;

        return matchesSearch && matchesStatus && matchesDate && matchesIngredients;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (historySortBy === 'date') {
          comparison = new Date(b.scanned_at || 0).getTime() - new Date(a.scanned_at || 0).getTime();
        } else if (historySortBy === 'name') {
          comparison = (a.name || '').localeCompare(b.name || '');
        } else if (historySortBy === 'status') {
          comparison = (a.status || '').localeCompare(b.status || '');
        } else if (historySortBy === 'ingredients') {
          const aIngredients = Array.isArray(a.ingredients) ? a.ingredients.join(', ') : (a.ingredients || "");
          const bIngredients = Array.isArray(b.ingredients) ? b.ingredients.join(', ') : (b.ingredients || "");
          
          const aHasRisk = (Array.isArray(a.risk_ingredients) && a.risk_ingredients.length > 0) || 
                          userAlerts.some(alert => aIngredients.toLowerCase().includes(alert.toLowerCase()));
          const bHasRisk = (Array.isArray(b.risk_ingredients) && b.risk_ingredients.length > 0) || 
                          userAlerts.some(alert => bIngredients.toLowerCase().includes(alert.toLowerCase()));
          
          if (aHasRisk && !bHasRisk) comparison = -1;
          else if (!aHasRisk && bHasRisk) comparison = 1;
          else comparison = (a.name || '').localeCompare(b.name || '');
        }
        return historySortOrder === 'desc' ? comparison : -comparison;
      });
  }, [historyWithAlerts, historySearchQuery, historyStatusFilter, historyStartDateFilter, historyEndDateFilter, historySortBy, historySortOrder, userAlerts]);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage = { text: chatMessage, sender: 'user' as const, time: now };
    
    setChatHistory(prev => [...prev, newMessage]);
    setChatMessage('');
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = { 
        text: "Gracias por contactar con DeenSnap. Un agente se unirá en breve para ayudarte con tu consulta.", 
        sender: 'ai' as const, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      setChatHistory(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleAddAlert = async () => {
    const trimmed = newAlertInput.trim();
    if (trimmed && !userAlerts.includes(trimmed)) {
      const updatedAlerts = [...userAlerts, trimmed];
      setUserAlerts(updatedAlerts);
      setNewAlertInput('');
      setIsAddingAlert(false);
      
      // Update local profile state
      if (userProfile) {
        setUserProfile({ ...userProfile, alerts: updatedAlerts });
      }

      // Persist to Supabase if profile exists
      if (userProfile?.id) {
        await updateUserProfile({ id: userProfile.id, alerts: updatedAlerts });
      }
    }
  };

  const removeAlert = async (alertToRemove: string) => {
    const updatedAlerts = userAlerts.filter(a => a !== alertToRemove);
    setUserAlerts(updatedAlerts);
    
    // Update local profile state
    if (userProfile) {
      setUserProfile({ ...userProfile, alerts: updatedAlerts });
    }

    // Persist to Supabase if profile exists
    if (userProfile?.id) {
      await updateUserProfile({ id: userProfile.id, alerts: updatedAlerts });
    }
  };

  const handleDeleteHistoryEntry = async (barcode: string, scannedAt: string) => {
    const userId = userProfile?.id || session?.user?.id || 'demo-user-id';
    try {
      // Delete from local storage
      const localHistory = JSON.parse(localStorage.getItem('deensnap_history') || '[]');
      const updatedLocal = localHistory.filter((item: any) => !(item.product_barcode === barcode && item.scanned_at === scannedAt));
      localStorage.setItem('deensnap_history', JSON.stringify(updatedLocal));

      // Delete from Supabase if we have a real session
      if (supabase && (userProfile?.id || session?.user?.id)) {
        await deleteHistoryEntry(userId, barcode, scannedAt);
      }
      
      setHistory(prev => prev.filter(item => !(item.product_barcode === barcode && item.scanned_at === scannedAt)));
    } catch (err) {
      console.error("Error deleting history entry:", err);
    }
  };

  const handleClearHistory = async () => {
    const userId = userProfile?.id || session?.user?.id || 'demo-user-id';
    setConfirmModal({
      title: t('history') || "Historial",
      message: t('confirm_delete_history') || "¿Estás seguro de que quieres borrar todo tu historial?",
      onConfirm: async () => {
        setLoading(true);
        setLoadingMessage(t('deleting_history') || "Borrando historial...");
        try {
          // Clear local storage
          localStorage.removeItem('deensnap_history');
          
          // Clear Supabase if we have a real session
          if (supabase && (userProfile?.id || session?.user?.id)) {
            await deleteUserHistory(userId);
          }
          setHistory([]);
        } catch (err) {
          console.error("Error clearing history:", err);
        } finally {
          setLoading(false);
          setConfirmModal(null);
        }
      }
    });
  };

  const handleRefreshHistory = async () => {
    const userId = userProfile?.id || session?.user?.id || 'demo-user-id';
    setLoading(true);
    setLoadingMessage(t('loading_history') || "Actualizando historial...");
    try {
      const updatedHistory = await loadHistory(userId);
      setHistory(updatedHistory);
    } catch (err) {
      console.error("Error refreshing history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadData = () => {
    const userData = {
      profile: {
        name: "Muhamadou Camara",
        email: "muhamadou@example.com",
        membership: isPremium ? "Elite" : "Standard"
      },
      preferences: {
        language,
        alerts: userAlerts
      },
      history: history,
      exportDate: new Date().toISOString(),
      legalNotice: "This data is provided in accordance with GDPR Article 15 (Right of Access) and Article 20 (Right to Data Portability)."
    };

    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deensnap-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    if (link.parentNode === document.body) {
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(url);
  };

  const saveToHistory = async (barcode: string, product: any) => {
    const userId = userProfile?.id || session?.user?.id || 'demo-user-id';
    
    try {
      console.log(`App: Saving product ${barcode} to history for user ${userId}`);
      
      // 1. Save product details first (needed for join in loadHistory)
      const productToSave = {
        barcode: barcode,
        name: product.name || product.product_name || `Producto ${barcode}`,
        ingredients: product.ingredients || "",
        status: product.status || 'DUDOSO',
        reason: product.reason || "",
        risk_ingredients: product.risk_ingredients || [],
        confidence: product.confidence || "media",
        certification: product.certification,
        alternatives: product.alternatives || [],
        nutriments: product.nutriments,
        user_id: userId
      };

      // Save product details (this handles local storage caching internally)
      await saveProduct(productToSave);

      // 2. Save scan entry (this handles local storage fallback internally)
      await saveScanToHistory(userId, barcode);
      
      // 3. Refresh local history state
      const updatedHistory = await loadHistory(userId);
      if (updatedHistory) {
        setHistory(updatedHistory);
        console.log(`App: History updated with ${updatedHistory.length} entries`);
      }
    } catch (err) {
      console.error("App: Error in saveToHistory process:", err);
    }
  };

  useEffect(() => {
    // Handle payment success redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success' && userProfile?.id) {
      const activatePremium = async () => {
        setLoading(true);
        setLoadingMessage(t('applying_settings'));
        try {
          await updateUserProfile({ id: userProfile.id, plan: 'premium' });
          setUserProfile({ ...userProfile, plan: 'premium' });
          // Clear URL params
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          console.error("Error activating premium:", error);
        } finally {
          setLoading(false);
        }
      };
      activatePremium();
    }
  }, [userProfile, t]);

  const handleLogout = async () => {
    setConfirmModal({
      title: t('logout'),
      message: t('confirm_logout'),
      onConfirm: async () => {
        setConfirmModal(null);
        setLoading(true);
        setLoadingMessage(t('logging_out'));
        
        try {
          if (supabase) await supabase.auth.signOut();
          setSession(null);
          setScreen('home');
          setHistory([]);
          setFavorites([]);
          setMeals([]);
          setUserProfile(null);
          
          // Clear any local storage if used
          localStorage.removeItem('supabase.auth.token');
          
          // Reload to ensure a completely clean state and redirect to Auth
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } catch (error) {
          console.error("Logout error:", error);
          window.location.reload();
        }
      }
    });
  };

  const handleCheckout = async (planType: 'monthly' | 'yearly') => {
    console.log(`App: Initiating checkout for plan: ${planType}`);
    if (!userProfile?.id) {
      console.warn("App: No userProfile.id found during checkout attempt");
      setError("Debes iniciar sesión para suscribirte");
      return;
    }

    setLoading(true);
    setLoadingMessage(t('connecting_stripe') || "Preparando el pago...");
    setError(null);
    
    try {
      console.log("App: Fetching checkout session...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          userId: userProfile.id,
          userEmail: userProfile.email || session?.user?.email,
          planType
        }),
      });
      
      clearTimeout(timeoutId);
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("App: Expected JSON (v2), got:", text.substring(0, 100));
        throw new Error(`[v2] El servidor no respondió con JSON (Status: ${response.status}). Por favor, contacta con soporte.`);
      }

      const data = await response.json().catch((err) => {
        console.error("App: JSON parse error (v2):", err);
        return { error: "[v2] Error al procesar la respuesta del servidor" };
      });
      
      if (!response.ok || data.error) {
        console.error("App: Checkout session fetch failed:", response.status, data);
        throw new Error(data.error || "Error al crear la sesión de pago");
      }
      
      console.log("App: Checkout session created, redirecting to:", data.url);
      if (data.url) {
        // Direct redirect is more reliable for PWAs and mobile
        window.location.href = data.url;
      } else {
        throw new Error("No se recibió la URL de pago de Stripe");
      }
    } catch (error: any) {
      console.error("App: Upgrade error (v2):", error);
      if (error.name === 'AbortError') {
        setError("La conexión con el servidor ha tardado demasiado. Por favor, inténtalo de nuevo.");
      } else {
        setError(error.message || "Error al iniciar el pago con Stripe");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userProfile?.id) return;
    setConfirmModal({
      title: t('delete_account'),
      message: t('privacy_deletion'),
      onConfirm: async () => {
        setConfirmModal(null);
        setLoading(true);
        setLoadingMessage(t('deleting_history'));
        try {
          await deleteUserAccount(userProfile.id);
          setSession(null);
          setScreen('home');
          setHistory([]);
          setFavorites([]);
          setMeals([]);
          setUserProfile(null);
          localStorage.removeItem('supabase.auth.token');
          window.location.reload();
        } catch (error) {
          console.error("Delete account error:", error);
          setError("Error al eliminar la cuenta");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleReportMissing = useCallback(async (barcode: string, name?: string) => {
    if (!userProfile?.id) return;
    setLoading(true);
    setLoadingMessage(t('sending_report') || "Enviando reporte...");
    try {
      await reportMissingProduct({
        user_id: userProfile.id,
        barcode,
        name
      });
      
      setConfirmModal({
        title: "¡Gracias!",
        message: "Tu reporte nos ayuda a mejorar.",
        onConfirm: () => setConfirmModal(null)
      });
    } catch (err) {
      console.error("Error reporting missing product:", err);
    } finally {
      setLoading(false);
    }
  }, [userProfile, t]);


  useEffect(() => {
    const syncLanguage = async () => {
      if (userProfile?.id && userProfile.language !== language) {
        console.log("App: Syncing language to Supabase:", language);
        await updateUserProfile({ id: userProfile.id, language });
      }
    };
    syncLanguage();
  }, [language, userProfile?.id]);

  useEffect(() => {
    const syncAlerts = async () => {
      if (userProfile?.id) {
        const profileAlerts = userProfile.alerts || [];
        // Only update if the alerts in profile differ from state
        if (JSON.stringify(profileAlerts) !== JSON.stringify(userAlerts)) {
          console.log("App: Syncing alerts to Supabase:", userAlerts);
          await updateUserProfile({ id: userProfile.id, alerts: userAlerts });
          // Update local state without triggering a full re-render loop if possible
          setUserProfile(prev => prev ? { ...prev, alerts: userAlerts } : null);
        }
      }
    };
    syncAlerts();
  }, [userAlerts, userProfile?.id]);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        if ("geolocation" in navigator && navigator.permissions) {
          try {
            const geoStatus = await navigator.permissions.query({ name: 'geolocation' });
            setPermissions(prev => ({ ...prev, location: geoStatus.state }));
            geoStatus.onchange = () => setPermissions(prev => ({ ...prev, location: geoStatus.state }));
          } catch (e) {
            console.warn("Geolocation permission query not supported");
          }
        }

        if ("Notification" in window) {
          setPermissions(prev => ({ ...prev, notifications: Notification.permission }));
        }

        if (navigator.permissions) {
          try {
            const cameraStatus = await navigator.permissions.query({ name: 'camera' as any });
            setPermissions(prev => ({ ...prev, camera: cameraStatus.state }));
            cameraStatus.onchange = () => setPermissions(prev => ({ ...prev, camera: cameraStatus.state }));
          } catch (e) {
            setPermissions(prev => ({ ...prev, camera: 'prompt' }));
          }
        }
      } catch (err) {
        console.error("Error checking permissions:", err);
      }
    };

    const handleError = (event: ErrorEvent) => {
      const message = event.error?.message || event.message || "Runtime error";
      console.error("Global error:", message, event.error);
      
      // Ignore common benign errors that don't affect functionality
      if (
        message.includes('ResizeObserver') || 
        message.includes('Script error') ||
        message.includes('play() interrupted') ||
        message.includes('The play() request was interrupted')
      ) return;
      
      setError(message);
    };

    const init = async () => {
      console.log("App: Starting initialization...");
      try {
        // Load daily scans from local storage
        const today = new Date().toISOString().split('T')[0];
        const lastScanDate = localStorage.getItem('deensnap_last_scan_date');
        const savedDailyScans = localStorage.getItem('deensnap_daily_scans');

        if (lastScanDate !== today) {
          localStorage.setItem('deensnap_last_scan_date', today);
          localStorage.setItem('deensnap_daily_scans', '0');
          setDailyScans(0);
        } else if (savedDailyScans) {
          setDailyScans(parseInt(savedDailyScans, 10));
        }

        if (!supabase) {
          setIsAppLoaded(true);
          return;
        }

        // Check for current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);

        if (!currentSession) {
          // Load local history for non-logged in users
          const localHistory = await loadHistory('demo-user-id');
          if (localHistory) setHistory(localHistory);
          setIsAppLoaded(true);
          return;
        }

        const userId = currentSession.user.id;
        
        // Update daily scans in local storage whenever it changes
        const updateDailyScans = (count: number) => {
          setDailyScans(count);
          localStorage.setItem('deensnap_daily_scans', count.toString());
        };

        // Set a safety timeout to ensure the app loads even if background tasks hang
        const safetyTimeout = setTimeout(() => {
          console.warn("App: Initialization taking too long, forcing load state...");
          setIsAppLoaded(true);
        }, 8000);

        console.log("App: Loading history and profile for user:", userId);
        
        const [historyRes, profileRes, privacyRes, favoritesRes, mealsRes] = await Promise.allSettled([
          loadHistory(userId).catch(e => console.error("App: loadHistory failed", e)),
          getUserProfile(userId).catch(e => console.error("App: getUserProfile failed", e)),
          getPrivacySettings(userId).catch(e => console.error("App: getPrivacySettings failed", e)),
          getUserFavorites(userId).catch(e => console.error("App: getUserFavorites failed", e)),
          getUserMeals(userId).catch(e => console.error("App: getUserMeals failed", e))
        ]);

        if (historyRes.status === 'fulfilled' && historyRes.value) {
          setHistory(historyRes.value);
        }

        if (profileRes.status === 'fulfilled' && profileRes.value) {
          const profile = {
            ...profileRes.value,
            email: profileRes.value.email || currentSession.user.email || ""
          };
          setUserProfile(profile);
          if (profile.alerts) {
            setUserAlerts(profile.alerts);
          }
          if (profile.language && profile.language !== language) {
            setLanguage(profile.language as any);
          }
        } else {
          // Create a default profile if none exists for this user
          const defaultProfile = {
            id: userId,
            email: currentSession.user.email || "",
            name: currentSession.user.user_metadata?.full_name || "Usuario",
            alerts: ['E471', 'Gelatina', 'Alcohol'],
            plan: 'Elite',
            language: language,
            permissions_accepted: false
          };
          setUserProfile(defaultProfile);
          await updateUserProfile(defaultProfile);
        }

        if (favoritesRes.status === 'fulfilled' && favoritesRes.value) {
          setFavorites(favoritesRes.value);
        }

        if (mealsRes.status === 'fulfilled' && mealsRes.value) {
          setMeals(mealsRes.value);
        }

        if (privacyRes.status === 'fulfilled' && privacyRes.value) {
          setPermissions({
            camera: privacyRes.value.allow_camera ? 'granted' : 'denied',
            location: privacyRes.value.allow_location ? 'granted' : 'denied',
            notifications: privacyRes.value.allow_notifications ? 'granted' : 'denied'
          });
          if (privacyRes.value.accepted_privacy) {
            localStorage.setItem('deensnap_permissions_accepted', 'true');
            setHasAcceptedPermissions(true);
          }
        }

        if (localStorage.getItem('deensnap_permissions_accepted') !== 'true') {
          setScreen('permissions_request');
        }
        
        clearTimeout(safetyTimeout);
        console.log("App: Initialization complete.");
      } catch (err) {
        console.error("App: Critical initialization error:", err);
      } finally {
        setIsAppLoaded(true);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('focus', checkPermissions);
    init();
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('focus', checkPermissions);
    };
  }, []);

  useEffect(() => {
    if (isAppLoaded && localStorage.getItem('deensnap_permissions_accepted') !== 'true' && screen !== 'permissions_request') {
      setScreen('permissions_request');
    }
  }, [screen, isAppLoaded]);

  const requestPermission = async (type: 'camera' | 'location' | 'notifications') => {
    try {
      if (type === 'location') {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              setPermissions(prev => ({ ...prev, location: 'granted' }));
              resolve('granted');
            },
            (error) => {
              console.error("Location error:", error);
              setPermissions(prev => ({ ...prev, location: 'denied' }));
              resolve('denied');
            },
            { enableHighAccuracy: true }
          );
        });
      } else if (type === 'notifications') {
        const result = await Notification.requestPermission();
        setPermissions(prev => ({ ...prev, notifications: result }));
      } else if (type === 'camera') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          stream.getTracks().forEach(track => track.stop());
          setPermissions(prev => ({ ...prev, camera: 'granted' }));
          return 'granted';
        } catch (e) {
          console.error("Camera error:", e);
          setPermissions(prev => ({ ...prev, camera: 'denied' }));
          return 'denied';
        }
      }
    } catch (err) {
      console.error(`Error requesting ${type} permission:`, err);
    }
  };

  const handleApplyPermissions = async () => {
    setLoading(true);
    setLoadingMessage(t('applying_settings') || "Aplicando ajustes...");
    try {
      // We try to request both, but camera is the critical one for the scanner
      const cameraStatus = await requestPermission('camera');
      const locationStatus = await requestPermission('location');
      const notificationStatus = await requestPermission('notifications');
      
      if (userProfile?.id) {
        await savePrivacySettings({
          user_id: userProfile.id,
          accepted_privacy: true,
          privacy_version: '1.0',
          allow_camera: cameraStatus === 'granted',
          allow_location: locationStatus === 'granted',
          allow_notifications: notificationStatus === 'granted'
        });
        await updateUserProfile({ id: userProfile.id, permissions_accepted: true });
      }

      if (cameraStatus === 'granted') {
        localStorage.setItem('deensnap_permissions_accepted', 'true');
        setHasAcceptedPermissions(true);
        setScreen('home');
      }
    } catch (err) {
      console.error("Error applying permissions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = useCallback(async (barcode: string) => {
    if (!barcode || barcode.trim() === "") {
      setError("Código de barras no válido.");
      return;
    }

    if (!isPremium && dailyScans >= 5) {
      setConfirmModal({
        title: t('premium'),
        message: t('free_limit_reached') + " " + t('upgrade_to_premium'),
        onConfirm: () => {
          setScreen('premium');
          setConfirmModal(null);
        }
      });
      return;
    }

    setLoading(true);
    setLoadingMessage(t('analyzing_ingredients'));
    setError(null);

    // Safety timeout for the entire scan process
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
      setError(t('error_timeout'));
      setScreen('home');
    }, 35000); // 35 seconds total safety timeout

    try {
      setLoadingMessage("Buscando en caché...");
      const cached = await getSavedProduct(barcode);
      if (cached) {
        console.log("App: Product found in cache, applying alerts and saving to history...");
        clearTimeout(safetyTimeout);
        
        // Apply personal alerts to cached product for display
        const ingredientsText = cached.ingredients || "";
        const foundAlerts = userAlerts.filter(alert => 
          ingredientsText.toLowerCase().includes(alert.toLowerCase())
        );

        let finalProduct = { ...cached };
        if (foundAlerts.length > 0 && finalProduct.status === 'HALAL') {
          finalProduct.status = 'DUDOSO';
          finalProduct.reason = `${t('doubtful')}: ${foundAlerts.join(', ')}. ${finalProduct.reason || ''}`;
        }

        setCurrentProduct(finalProduct as any);
        setScreen('result');
        setLoading(false);
        setDailyScans(prev => prev + 1);
        
        // Save to history (this will use the objective cached product for the products table)
        await saveToHistory(barcode, cached);
        return;
      }

      setLoadingMessage("Consultando base de datos...");
      
      const product = await fetchProductFromOFF(barcode);
      
      // Case 1: Product not found in OFF (status 0)
      if (product && product.status === 0) {
        setLoadingMessage(t('consulting_ai'));
        // Fallback to Gemini Search
        const searchResult = await searchProductByBarcode(barcode);
        if (searchResult) {
          const analysisResult = {
            barcode,
            name: searchResult.name,
            ingredients: searchResult.ingredients,
            status: searchResult.status,
            reason: searchResult.reason,
            risk_ingredients: searchResult.risk_ingredients,
            confidence: searchResult.confidence,
            certification: searchResult.certification,
            alternatives: searchResult.alternatives,
            user_id: userProfile?.id
          };
          
          // Apply personal alerts
          const foundAlerts = userAlerts.filter(alert => 
            (analysisResult.ingredients || "").toLowerCase().includes(alert.toLowerCase())
          );
          
          let displayResult = { ...analysisResult };
          if (foundAlerts.length > 0 && displayResult.status === 'HALAL') {
            displayResult.status = 'DUDOSO';
            displayResult.reason = `${t('doubtful')}: ${foundAlerts.join(', ')}. ${displayResult.reason || ''}`;
          }
          
          setCurrentProduct(displayResult as any);
          
          // Save to history and refresh (save objective result)
          await saveToHistory(barcode, analysisResult);
          
          setDailyScans(prev => prev + 1);
          setScreen('result');
          setLoading(false);
          return;
        } else {
          throw new Error(t('error_not_found'));
        }
      }

      // Case 2: API Error or null product
      if (!product) {
        throw new Error(t('error_generic'));
      }

      // Case 3: Product found (status 1)
      if (product.status === 1) {
        // Check for ingredients in multiple sources
        const hasIngredientsText = product.ingredients && product.ingredients.trim().length > 0;
        const hasIngredientsList = product.ingredients_list && product.ingredients_list.length > 0;
        const hasAdditives = product.additives_tags && product.additives_tags.length > 0;

        if (!hasIngredientsText && !hasIngredientsList && !hasAdditives) {
          // Product exists but no ingredients available
          setError(t('error_no_ingredients'));
          setLoading(false);
          return;
        }

        // We have ingredients, proceed to analysis
        setLoadingMessage("Analizando ingredientes con IA...");
        
        // Prepare ingredients string for Gemini if ingredients_text is empty
        let ingredientsToAnalyze = product.ingredients;
        if (!hasIngredientsText) {
          if (hasIngredientsList) {
            ingredientsToAnalyze = product.ingredients_list!.map(i => i.text || i.id).join(', ');
          } else if (hasAdditives) {
            ingredientsToAnalyze = `Additives: ${product.additives_tags!.join(', ')}`;
          }
        }

        const analysis = await analyzeIngredients(ingredientsToAnalyze, product.name, language);
        
        if (!analysis) {
          throw new Error("Error al analizar el producto.");
        }

        // Check for personal alerts
        const foundAlerts = userAlerts.filter(alert => 
          ingredientsToAnalyze.toLowerCase().includes(alert.toLowerCase())
        );

        // Objective product (without personal alerts)
        const objectiveProduct = { ...product, ...analysis, ingredients: ingredientsToAnalyze };
        
        // Apply personal alerts for current display
        let displayProduct = { ...objectiveProduct };
        if (foundAlerts.length > 0 && displayProduct.status === 'HALAL') {
          displayProduct.status = 'DUDOSO';
          displayProduct.reason = `${t('doubtful')}: ${foundAlerts.join(', ')}. ${displayProduct.reason || ''}`;
        }

        setCurrentProduct(displayProduct);

        // Save objective product to cache, but record this scan in history
        await saveToHistory(objectiveProduct.barcode, objectiveProduct);

        setDailyScans(prev => prev + 1);
        setScreen('result');
      }
    } catch (err: any) {
      setError(err.message || t('error_generic'));
      // Don't change screen if it's just an error message we want to show on current screen
      // but here we are in a loading state, so maybe go back to home or stay
      if (screen === 'scanner') setScreen('home');
    } finally {
      clearTimeout(safetyTimeout);
      setLoading(false);
    }
  }, [isPremium, dailyScans, t, userAlerts, userProfile, language, screen]);

  const handleSearchByName = async (name: string) => {
    if (!name || name.trim() === "") return;
    
    setLoading(true);
    setLoadingMessage(t('consulting_ai'));
    setError(null);

    try {
      const searchResult = await searchProductByName(name, language);
      if (searchResult) {
        const barcode = `SEARCH_${Date.now()}`;
        const fullProduct = {
          barcode,
          name: searchResult.name,
          ingredients: searchResult.ingredients,
          status: searchResult.status,
          reason: searchResult.reason,
          risk_ingredients: searchResult.risk_ingredients,
          confidence: searchResult.confidence,
          certification: searchResult.certification,
          alternatives: searchResult.alternatives
        };

        // Apply personal alerts
        const foundAlerts = userAlerts.filter(alert => 
          (fullProduct.ingredients || "").toLowerCase().includes(alert.toLowerCase())
        );
        
        let displayProduct = { ...fullProduct };
        if (foundAlerts.length > 0 && displayProduct.status === 'HALAL') {
          displayProduct.status = 'DUDOSO';
          displayProduct.reason = `${t('doubtful')}: ${foundAlerts.join(', ')}. ${displayProduct.reason || ''}`;
        }

        setCurrentProduct(displayProduct as any);
        setDailyScans(prev => prev + 1);
        setScreen('result');
        
        // Save to history and refresh (save objective product)
        await saveToHistory(barcode, fullProduct);
      } else {
        setError(t('error_not_found'));
      }
    } catch (err: any) {
      setError(err.message || t('error_generic'));
    } finally {
      setLoading(false);
    }
  };

  console.log("App: Rendering main component, screen:", screen, "isAppLoaded:", isAppLoaded, "session:", !!session);

  if (!isAppLoaded) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center z-[9999] text-white">
        <div className="flex flex-col items-center">
          <Logo size={100} className="mb-8" />
          <h1 className="text-3xl font-bold font-display tracking-tighter">DeenSnap</h1>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Cargando Inteligencia</span>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth onSuccess={(user) => {
      setSession({ user });
      // If it's a demo user, don't reload, just let the app load
      if (user.id === 'demo-user-id') {
        setIsAppLoaded(true);
        setScreen('home');
        setUserProfile({
          id: 'demo-user-id',
          email: 'demo@deensnap.app',
          name: 'Usuario Demo',
          plan: 'free'
        });
      } else {
        setIsAppLoaded(false);
        // Re-initialize to load user data
        setTimeout(() => {
          window.location.reload(); // Simplest way to re-init everything
        }, 100);
      }
    }} />;
  }

  const showMobileNav = ['home', 'history', 'premium', 'map', 'settings', 'favorites', 'meals', 'profile_settings', 'language_settings', 'privacy_settings', 'support_settings', 'terms_settings', 'permissions_settings'].includes(screen);

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return (
          <HomeScreen 
            t={t} 
            setScreen={setScreen} 
            handleSearchByName={handleSearchByName} 
            historyWithAlerts={historyWithAlerts} 
            setCurrentProduct={setCurrentProduct} 
          />
        );

      case 'scanner':
        return (
          <Scanner 
            onScan={handleScan} 
            onClose={() => setScreen('home')} 
            onReportMissing={(barcode) => handleReportMissing(barcode)}
          />
        );

      case 'result':
        return currentProduct ? (
          <ResultView 
            product={currentProduct} 
            onBack={() => setScreen('home')} 
            userProfile={userProfile}
          />
        ) : null;

      case 'history':
        return (
          <HistoryScreen 
            t={t}
            setScreen={setScreen}
            history={history}
            handleClearHistory={handleClearHistory}
            historySearchQuery={historySearchQuery}
            setHistorySearchQuery={setHistorySearchQuery}
            historyStatusFilter={historyStatusFilter}
            setHistoryStatusFilter={setHistoryStatusFilter}
            historyStartDateFilter={historyStartDateFilter}
            setHistoryStartDateFilter={setHistoryStartDateFilter}
            historyEndDateFilter={historyEndDateFilter}
            setHistoryEndDateFilter={setHistoryEndDateFilter}
            historyIngredientsFilter={historyIngredientsFilter}
            setHistoryIngredientsFilter={setHistoryIngredientsFilter}
            historySortBy={historySortBy}
            setHistorySortBy={setHistorySortBy}
            historySortOrder={historySortOrder}
            setHistorySortOrder={setHistorySortOrder}
            filteredHistory={filteredHistory}
            setLoading={setLoading}
            setLoadingMessage={setLoadingMessage}
            setCurrentProduct={setCurrentProduct}
            handleDeleteHistoryEntry={handleDeleteHistoryEntry}
            handleRefreshHistory={handleRefreshHistory}
          />
        );

      case 'favorites':
        return (
          <FavoritesScreen 
            t={t}
            setScreen={setScreen}
            favoritesWithAlerts={favoritesWithAlerts}
            setLoading={setLoading}
            setLoadingMessage={setLoadingMessage}
            setCurrentProduct={setCurrentProduct}
          />
        );

      case 'meals':
        return (
          <MealsScreen 
            t={t}
            setScreen={setScreen}
            meals={meals}
          />
        );

      case 'map':
        return (
          <MapScreen 
            onBack={() => setScreen('home')} 
            setScreen={setScreen}
            screen={screen}
          />
        );

      case 'settings':
        return (
          <SettingsScreen 
            t={t}
            setScreen={setScreen}
            userProfile={userProfile}
            language={language}
            setLanguage={setLanguage}
            theme={theme}
            setTheme={setTheme}
            handleLogout={handleLogout}
            handleDownloadData={handleDownloadData}
          />
        );

      case 'premium':
        return (
          <PremiumScreen 
            t={t}
            setScreen={setScreen}
            handleCheckout={handleCheckout}
            isPremium={isPremium}
          />
        );

      case 'profile_settings':
        return (
          <ProfileSettingsScreen 
            t={t}
            setScreen={setScreen}
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            loading={loading}
            setLoading={setLoading}
            setLoadingMessage={setLoadingMessage}
          />
        );

      case 'language_settings':
        return (
          <LanguageSettingsScreen 
            t={t}
            setScreen={setScreen}
            language={language}
            setLanguage={setLanguage}
          />
        );

      case 'privacy_settings':
        return (
          <PrivacySettingsScreen 
            t={t}
            setScreen={setScreen}
            handleDownloadData={handleDownloadData}
            setConfirmModal={setConfirmModal}
            userProfile={userProfile}
            setLoading={setLoading}
            setLoadingMessage={setLoadingMessage}
            setHistory={setHistory}
            setMeals={setMeals}
            permissions={permissions}
            requestPermission={requestPermission}
            handleDeleteAccount={handleDeleteAccount}
          />
        );

      case 'terms_settings':
        return (
          <TermsSettingsScreen 
            t={t}
            setScreen={setScreen}
          />
        );

      case 'permissions_settings':
        return (
          <PermissionsSettingsScreen 
            t={t}
            setScreen={setScreen}
            permissions={permissions}
            requestPermission={requestPermission}
          />
        );

      case 'permissions_request':
        return (
          <PermissionsRequestScreen 
            t={t}
            setScreen={setScreen}
            permissions={permissions}
            requestPermission={requestPermission}
            handleApplyPermissions={handleApplyPermissions}
          />
        );

      case 'support_settings':
        return (
          <SupportSettingsScreen 
            t={t}
            setScreen={setScreen}
            isPremium={isPremium}
            setShowChat={setShowChat}
            setShowTicketForm={setShowTicketForm}
            setShowHelpCenter={setShowHelpCenter}
            openFaq={openFaq}
            setOpenFaq={setOpenFaq}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-[#0A0A0A] min-h-screen shadow-2xl relative overflow-hidden selection:bg-emerald-500/30 flex flex-col lg:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex w-80 flex-col p-8 border-r border-white/5 bg-[#050505]/50 backdrop-blur-3xl sticky top-0 h-screen z-50">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 rounded-2xl premium-gradient flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Shield className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display leading-tight tracking-tight">DeenSnap</h1>
            <p className="text-[10px] text-emerald-400/60 uppercase tracking-[0.2em] font-bold">Intelligence v3.0</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'home', icon: Menu, label: t('home') },
            { id: 'scanner', icon: Scan, label: t('scanner') },
            { id: 'history', icon: Clock, label: t('history') },
            { id: 'map', icon: MapIcon, label: t('halal_map') },
            { id: 'premium', icon: Crown, label: `Elite ${t('premium')}`, color: 'text-gold-400' },
            { id: 'settings', icon: User, label: t('settings') },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setScreen(item.id as Screen)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group",
                screen === item.id 
                  ? "bg-white text-black shadow-xl" 
                  : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={22} className={cn("transition-transform group-hover:scale-110", item.color)} />
              <span className="font-bold tracking-tight">{item.label}</span>
              {screen === item.id && (
                <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-black" />
              )}
            </button>
          ))}
        </nav>

        <div className="pt-8 border-t border-white/5 space-y-4">
          <div className="p-6 rounded-[2rem] glass-card border-gold-500/20 relative overflow-hidden group cursor-pointer" onClick={() => setScreen('premium')}>
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
              <Crown size={40} className="text-gold-400" />
            </div>
            <h4 className="font-bold text-sm text-gold-400 mb-1">Elite Status</h4>
            <p className="text-[10px] text-white/40 leading-relaxed">Desbloquea todas las funciones avanzadas.</p>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all">
            <LogOut size={22} />
            <span className="font-bold tracking-tight">{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 relative flex flex-col items-center">
        <div className="w-full max-w-4xl min-h-screen relative z-10">
          <AnimatePresence mode="wait">
            {renderScreen()}
          </AnimatePresence>
          {showMobileNav && <MobileNav screen={screen} setScreen={setScreen} />}
        </div>

        {/* Background Decor */}
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full" />
        </div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center space-y-6"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500" size={32} />
            </div>
            <div className="text-center px-6">
              <h3 className="text-xl font-bold font-display mb-2">{loadingMessage || t('loading')}</h3>
              {loadingMessage === t('consulting_ai') && (
                <p className="text-white/40 text-sm animate-pulse">{t('consulting_ai_desc') || 'Analizando ingredientes con IA...'}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-32 left-6 right-6 z-[100] p-5 bg-rose-500 text-white rounded-[2rem] shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <Zap size={20} />
              <p className="text-sm font-bold">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto opacity-50 hover:opacity-100">
                <ArrowRight size={16} />
              </button>
            </div>
            
            {error === t('error_not_found') && (
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => {
                    setError(null);
                    setScreen('home');
                    setTimeout(() => {
                      searchInputRef.current?.focus();
                    }, 100);
                  }}
                  className="py-3 bg-white/20 hover:bg-white/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  {t('search_by_name')}
                </button>
                <button 
                  onClick={() => {
                    setError(null);
                    setShowTicketForm(true);
                  }}
                  className="py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  {t('report_missing')}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Support Modals */}
      <AnimatePresence>
        {showChat && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <div className="w-full max-w-md glass-card rounded-[2.5rem] border-white/10 overflow-hidden flex flex-col h-[600px]">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-emerald-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <MessageSquare size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold">{t('chat_title')}</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-emerald-400/60 font-bold uppercase tracking-wider">Online</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowChat(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <Menu size={20} className="rotate-45" />
                </button>
              </div>
              
              <div 
                ref={scrollRef}
                className="flex-1 p-6 space-y-4 overflow-y-auto"
              >
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Shield size={14} className="text-emerald-400" />
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none max-w-[80%]">
                    <p className="text-sm text-white/80">{t('chat_welcome')}</p>
                    <span className="text-[10px] text-white/20 mt-2 block">09:41 AM</span>
                  </div>
                </div>

                {chatHistory.map((msg, i) => (
                  <div key={i} className={cn("flex gap-3", msg.sender === 'user' ? "flex-row-reverse" : "")}>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      msg.sender === 'user' ? "bg-white/10" : "bg-emerald-500/20"
                    )}>
                      {msg.sender === 'user' ? <User size={14} /> : <Shield size={14} className="text-emerald-400" />}
                    </div>
                    <div className={cn(
                      "p-4 rounded-2xl max-w-[80%]",
                      msg.sender === 'user' ? "bg-emerald-500 text-black rounded-tr-none" : "bg-white/5 text-white/80 rounded-tl-none"
                    )}>
                      <p className="text-sm">{msg.text}</p>
                      <span className={cn("text-[10px] mt-2 block", msg.sender === 'user' ? "text-black/40" : "text-white/20")}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-white/5 border-t border-white/5">
                <div className="relative">
                  <input 
                    type="text" 
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={t('chat_placeholder')}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 text-black rounded-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {showTicketForm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <div className="w-full max-w-md glass-card rounded-[2.5rem] border-white/10 p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                    <FileText size={24} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold">{t('ticket_title')}</h3>
                </div>
                <button onClick={() => setShowTicketForm(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <Menu size={20} className="rotate-45" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-2">{t('ticket_subject')}</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-white/20 transition-all"
                    placeholder="..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-2">{t('ticket_message')}</label>
                  <textarea 
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-white/20 transition-all resize-none"
                    placeholder="..."
                  />
                </div>
                <button 
                  onClick={() => {
                    alert("Ticket enviado correctamente");
                    setShowTicketForm(false);
                  }}
                  className="w-full py-4 rounded-2xl bg-white text-black font-bold hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {t('ticket_send')}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {showHelpCenter && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed inset-0 z-[100] bg-[#0A0A0A] p-8 overflow-y-auto"
          >
            <div className="max-w-2xl mx-auto space-y-12">
              <div className="flex items-center justify-between pt-6">
                <div className="flex items-center gap-4">
                  <button onClick={() => setShowHelpCenter(false)} className="p-3 rounded-2xl glass-button">
                    <Menu size={20} className="rotate-180" />
                  </button>
                  <h1 className="text-3xl font-bold font-display tracking-tight">{t('help_center_title')}</h1>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                <input 
                  type="text" 
                  placeholder="Buscar soluciones..."
                  className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-6 pl-16 pr-8 text-lg focus:outline-none focus:border-white/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: t('help_topic_1'), icon: Sparkles, count: 12 },
                  { title: t('help_topic_2'), icon: Crown, count: 8 },
                  { title: t('help_topic_3'), icon: Shield, count: 15 },
                  { title: t('help_topic_4'), icon: Zap, count: 6 },
                ].map((topic, i) => (
                  <button key={i} className="p-8 rounded-[2.5rem] glass-card border-white/5 text-left hover:bg-white/5 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <topic.icon size={24} className="text-white/60" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{topic.title}</h3>
                    <p className="text-xs text-white/20 font-bold uppercase tracking-widest">{topic.count} Artículos</p>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm glass-card border-white/10 rounded-[3rem] p-8 space-y-8 text-center"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-bold font-display tracking-tight">{confirmModal.title}</h3>
                <p className="text-sm text-white/40 font-medium">{confirmModal.message}</p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold text-sm hover:bg-white/10 transition-all"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className="flex-1 py-4 rounded-2xl bg-rose-500 text-white font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-rose-500/20"
                >
                  {t('confirm')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

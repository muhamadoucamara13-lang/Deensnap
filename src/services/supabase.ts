import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase: Initializing with URL:", supabaseUrl);
if (supabaseAnonKey) {
  console.log("Supabase: Key provided (starts with):", supabaseAnonKey.substring(0, 10) + "...");
} else {
  console.warn("Supabase: No Anon Key provided!");
}

// Initialize Supabase only if valid credentials are provided
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://'))
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.error("Supabase: Failed to initialize client. Check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
}

export interface SavedProduct {
  barcode: string;
  name: string;
  ingredients: string;
  status: string;
  reason: string;
  risk_ingredients: string[];
  confidence: string;
  certification?: any;
  alternatives?: string[];
  nutriments?: any;
  image_url?: string;
  created_at?: string;
  user_id?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  language?: string;
  permissions_accepted?: boolean;
  goal?: string;
  daily_calories_target?: number;
  protein_target?: number;
  carbs_target?: number;
  alerts?: string[];
  plan?: string;
  is_premium?: boolean;
  premium_since?: string;
  stripe_customer_id?: string;
  created_at?: string;
}

export interface HistoryEntry {
  id?: string;
  user_id: string;
  product_barcode: string;
  product_name?: string;
  status?: string;
  ingredients?: string;
  risk_ingredients?: string[];
  scanned_at?: string;
}

export interface PrivacySettings {
  user_id: string;
  accepted_privacy: boolean;
  privacy_version: string;
  allow_camera: boolean;
  allow_location: boolean;
  allow_notifications: boolean;
  accepted_at?: string;
}

export interface MissingProduct {
  user_id: string;
  barcode: string;
  name?: string;
  created_at?: string;
}

export interface Favorite {
  user_id: string;
  barcode: string;
  created_at?: string;
}

export async function getSavedProduct(barcode: string): Promise<SavedProduct | null> {
  // Check local storage first
  try {
    const localProducts = JSON.parse(localStorage.getItem('deensnap_products') || '{}');
    if (localProducts[barcode]) {
      return localProducts[barcode];
    }
  } catch (e) {
    console.error("Error reading local products:", e);
  }

  if (!supabase) return null;
  
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Timeout reading from database")), 10000)
  );

  try {
    const fetchPromise = supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .single();
      
    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
    if (error || !data) return null;
    
    // Cache to local storage
    try {
      const localProducts = JSON.parse(localStorage.getItem('deensnap_products') || '{}');
      localProducts[barcode] = data;
      localStorage.setItem('deensnap_products', JSON.stringify(localProducts));
    } catch (e) {}

    return data;
  } catch (err) {
    console.error("Supabase read error or timeout:", err);
    return null;
  }
}

export async function saveProduct(product: SavedProduct) {
  // Save to local storage first
  try {
    const localProducts = JSON.parse(localStorage.getItem('deensnap_products') || '{}');
    localProducts[product.barcode] = product;
    localStorage.setItem('deensnap_products', JSON.stringify(localProducts));
  } catch (e) {
    console.error("Error saving to local products:", e);
  }

  if (!supabase) return;
  
  console.log(`Supabase: Intentando guardar producto barcode=${product.barcode}, name=${product.name}`);
  
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Timeout saving to database")), 10000)
  );

  try {
    const upsertPromise = supabase
      .from('products')
      .upsert(product);
      
    const { error } = await Promise.race([upsertPromise, timeoutPromise]) as any;
    if (error) {
      console.error("Supabase: Error guardando producto:", error.message);
    } else {
      console.log("Supabase: Producto guardado correctamente");
    }
  } catch (err) {
    console.error("Supabase: Excepción al guardar producto:", err);
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.warn("Profile not found or error:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Error fetching profile:", err);
    return null;
  }
}

export async function updateUserProfile(profile: Partial<UserProfile>) {
  if (!supabase || !profile.id) return;
  
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert(profile);
      
    if (error) throw error;
  } catch (err) {
    console.error("Error updating profile:", err);
  }
}


export interface MealEntry {
  id?: string;
  user_id: string;
  barcode: string;
  product_name: string;
  calories?: number;
  proteins?: number;
  fat?: number;
  carbs?: number;
  created_at?: string;
}

export async function logMeal(meal: MealEntry) {
  if (!supabase) return;
  
  try {
    const { error } = await supabase
      .from('meals')
      .insert(meal);
      
    if (error) throw error;
  } catch (err) {
    console.error("Error logging meal:", err);
  }
}

export async function saveScanToHistory(userId: string, barcode: string) {
  // Save to local storage first as a fallback
  try {
    const localHistory = JSON.parse(localStorage.getItem('deensnap_history') || '[]');
    const newEntry = {
      product_barcode: barcode,
      scanned_at: new Date().toISOString(),
      user_id: userId
    };
    localStorage.setItem('deensnap_history', JSON.stringify([newEntry, ...localHistory].slice(0, 100)));
  } catch (e) {
    console.error("Error saving to local history:", e);
  }

  if (!supabase) {
    console.warn("Supabase not initialized, saved to local history only");
    return;
  }
  
  console.log(`Supabase: Intentando guardar historial para usuario=${userId}, barcode=${barcode}`);
  
  try {
    const entry = {
      user_id: userId,
      product_barcode: barcode,
      scanned_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('history')
      .insert(entry)
      .select();

    if (error) {
      console.error("Supabase: Error guardando historial:", error.message);
    } else {
      console.log("Supabase: Historial guardado correctamente:", data);
    }
  } catch (err) {
    console.error("Supabase: Excepción al guardar historial:", err);
  }
}

export async function loadHistory(userId: string) {
  let localData: any[] = [];
  try {
    localData = JSON.parse(localStorage.getItem('deensnap_history') || '[]');
    // Filter by user_id if it's not a demo user
    if (userId !== 'demo-user-id') {
      localData = localData.filter(item => item.user_id === userId);
    }
  } catch (e) {
    console.error("Error loading local history:", e);
  }

  if (!supabase) {
    console.warn("Supabase not initialized, loading from local history");
    // We still need product details for local history
    const barcodes = [...new Set(localData.map(h => h.product_barcode))];
    if (barcodes.length === 0) return [];
    
    // Try to get product details from local storage
    let localProducts: any = {};
    try {
      localProducts = JSON.parse(localStorage.getItem('deensnap_products') || '{}');
    } catch (e) {}

    return localData.map(item => {
      const product = localProducts[item.product_barcode];
      return {
        ...item,
        name: product?.name || `Producto ${item.product_barcode}`,
        status: product?.status || 'DESCONOCIDO',
        ingredients: product?.ingredients || '',
        risk_ingredients: product?.risk_ingredients || []
      };
    });
  }
  
  console.log(`Loading history for user: ${userId}`);
  
  try {
    // Attempt to fetch history with product details using join
    const { data, error } = await supabase
      .from('history')
      .select(`
        product_barcode, 
        scanned_at,
        products:product_barcode (
          name,
          status,
          ingredients,
          risk_ingredients
        )
      `)
      .eq('user_id', userId)
      .order('scanned_at', { ascending: false });

    if (error) {
      console.error("Error loading history with join:", error);
      // Fallback: fetch history first, then products
      const { data: historyData, error: historyError } = await supabase
        .from('history')
        .select('product_barcode, scanned_at')
        .eq('user_id', userId)
        .order('scanned_at', { ascending: false });
        
      if (historyError || !historyData) return localData;
      
      // Fetch unique product details for these barcodes
      const barcodes = [...new Set(historyData.map(h => h.product_barcode))];
      if (barcodes.length === 0) return [];
      
      const { data: productsData } = await supabase
        .from('products')
        .select('barcode, name, status, ingredients, risk_ingredients')
        .in('barcode', barcodes);
        
      const productMap = new Map(productsData?.map(p => [p.barcode, p]) || []);
      
      const remoteHistory = historyData.map(item => {
        const product = productMap.get(item.product_barcode);
        return {
          product_barcode: item.product_barcode,
          scanned_at: item.scanned_at,
          name: product?.name || `Producto ${item.product_barcode}`,
          status: product?.status || 'DESCONOCIDO',
          ingredients: product?.ingredients || '',
          risk_ingredients: product?.risk_ingredients || []
        };
      });

      // Try to get product details from local storage for local history
      let localProducts: any = {};
      try {
        localProducts = JSON.parse(localStorage.getItem('deensnap_products') || '{}');
      } catch (e) {}

      // Merge local and remote, avoiding duplicates
      const merged = [...remoteHistory];
      localData.forEach(localItem => {
        if (!merged.some(remoteItem => remoteItem.product_barcode === localItem.product_barcode && remoteItem.scanned_at === localItem.scanned_at)) {
          const product = localProducts[localItem.product_barcode];
          merged.push({
            ...localItem,
            name: product?.name || `Producto ${localItem.product_barcode}`,
            status: product?.status || 'DESCONOCIDO',
            ingredients: product?.ingredients || '',
            risk_ingredients: product?.risk_ingredients || []
          });
        }
      });
      return merged.sort((a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime());
    }
    
    // Format data, handling potential array response from join
    const remoteHistory = (data || []).map((item: any) => {
      const product = Array.isArray(item.products) ? item.products[0] : item.products;
      return {
        product_barcode: item.product_barcode,
        scanned_at: item.scanned_at,
        name: product?.name || `Producto ${item.product_barcode}`,
        status: product?.status || 'DESCONOCIDO',
        ingredients: product?.ingredients || '',
        risk_ingredients: product?.risk_ingredients || []
      };
    });

    // Try to get product details from local storage for local history
    let localProducts: any = {};
    try {
      localProducts = JSON.parse(localStorage.getItem('deensnap_products') || '{}');
    } catch (e) {}

    // Merge local and remote
    const merged = [...remoteHistory];
    localData.forEach(localItem => {
      if (!merged.some(remoteItem => remoteItem.product_barcode === localItem.product_barcode && remoteItem.scanned_at === localItem.scanned_at)) {
        const product = localProducts[localItem.product_barcode];
        merged.push({
          ...localItem,
          name: product?.name || `Producto ${localItem.product_barcode}`,
          status: product?.status || 'DESCONOCIDO',
          ingredients: product?.ingredients || '',
          risk_ingredients: product?.risk_ingredients || []
        });
      }
    });
    return merged.sort((a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime());
  } catch (err) {
    console.error("Exception loading history:", err);
    return localData;
  }
}

export async function saveHistoryEntry(entry: HistoryEntry) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('history')
      .insert(entry);
    if (error) throw error;
  } catch (err) {
    console.error("Error saving history entry:", err);
  }
}

export async function getUserHistory(userId: string): Promise<HistoryEntry[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('history')
      .select('*')
      .eq('user_id', userId)
      .order('scanned_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching history:", err);
    return [];
  }
}

export async function deleteUserHistory(userId: string) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('history')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
  } catch (err) {
    console.error("Error deleting history:", err);
  }
}

export async function deleteHistoryEntry(userId: string, barcode: string, scannedAt: string) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('history')
      .delete()
      .eq('user_id', userId)
      .eq('product_barcode', barcode)
      .eq('scanned_at', scannedAt);
    if (error) throw error;
  } catch (err) {
    console.error("Error deleting history entry:", err);
  }
}

export async function savePrivacySettings(settings: PrivacySettings) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('privacy_settings')
      .upsert(settings);
    if (error) throw error;
  } catch (err) {
    console.error("Error saving privacy settings:", err);
  }
}

export async function getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('privacy_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) return null;
    return data;
  } catch (err) {
    return null;
  }
}

export async function reportMissingProduct(product: MissingProduct) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('missing_products')
      .insert(product);
    if (error) throw error;
  } catch (err) {
    console.error("Error reporting missing product:", err);
  }
}

export async function getUserMeals(userId: string): Promise<MealEntry[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching meals:", err);
    return [];
  }
}

export async function deleteUserMeals(userId: string) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
  } catch (err) {
    console.error("Error deleting meals:", err);
  }
}

export async function deleteUserAccount(userId: string) {
  if (!supabase) return;
  try {
    // Delete all user related data
    await Promise.all([
      supabase.from('history').delete().eq('user_id', userId),
      supabase.from('favorites').delete().eq('user_id', userId),
      supabase.from('meals').delete().eq('user_id', userId),
      supabase.from('privacy_settings').delete().eq('user_id', userId),
      supabase.from('profiles').delete().eq('id', userId)
    ]);
    
    // Sign out
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Error deleting account:", err);
    throw err;
  }
}

export async function toggleFavorite(favorite: Favorite) {
  if (!supabase) return;
  try {
    const { data: existing } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', favorite.user_id)
      .eq('barcode', favorite.barcode)
      .single();

    if (existing) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', favorite.user_id)
        .eq('barcode', favorite.barcode);
    } else {
      await supabase
        .from('favorites')
        .insert(favorite);
    }
  } catch (err) {
    console.error("Error toggling favorite:", err);
  }
}

export async function isFavorite(userId: string, barcode: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('barcode', barcode)
      .single();
    return !!data;
  } catch (err) {
    return false;
  }
}

export async function getUserFavorites(userId: string): Promise<any[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        barcode,
        created_at,
        products:barcode (
          name,
          status,
          ingredients
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(item => {
      const product = Array.isArray(item.products) ? item.products[0] : item.products;
      return {
        ...item,
        name: product?.name || `Producto ${item.barcode}`,
        status: product?.status || 'DESCONOCIDO',
        ingredients: product?.ingredients || ''
      };
    });
  } catch (err) {
    console.error("Error fetching favorites:", err);
    return [];
  }
}

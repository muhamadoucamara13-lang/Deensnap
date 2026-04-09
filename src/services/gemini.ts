import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { getFromCache, saveToCache, generateCacheKey } from "../lib/cache";

const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_SEARCH_MODEL = "gemini-3-flash-preview";

export interface AnalysisResult {
  status: "HALAL" | "DUDOSO" | "HARAM";
  reason: string;
  risk_ingredients: string[];
  confidence: "alta" | "media" | "baja";
  certification?: {
    logo?: string;
    country: string;
    certifier: string;
    reliability: "alta" | "media" | "baja";
  };
  alternatives?: string[];
}

function getApiKey() {
  // Debug log to verify environment variables in browser
  console.log("DEBUG: Checking Env Vars...", {
    hasViteKey: !!import.meta.env.VITE_GEMINI_API_KEY,
    envKeys: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'))
  });

  // Try process.env first (AI Studio standard) then import.meta.env (Vite/Vercel standard)
  const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("ERROR_V1.0.1: No se encontró la clave API de Gemini. Verifica que esté configurada en Vercel (VITE_GEMINI_API_KEY) o en los Secrets de AI Studio.");
  }
  return apiKey;
}

export async function analyzeIngredients(ingredients: string, productName: string, lang: string = 'es'): Promise<AnalysisResult> {
  const cacheKey = generateCacheKey('gemini_analysis', `${productName}_${ingredients}_${lang}`);
  const cached = getFromCache<AnalysisResult>(cacheKey);
  if (cached) return cached;

  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  const languageNames: Record<string, string> = {
    es: 'español', en: 'english', fr: 'français', ar: 'arabic'
  };
  const targetLang = languageNames[lang] || 'español';

  const prompt = `
    Actúa como experto en certificación halal en Europa.
    Analiza esta lista de ingredientes del producto "${productName}" y responde SOLO en formato JSON.
    CRÍTICO: Busca sellos oficiales. Explicación en ${targetLang}.
    Ingredientes: ${ingredients}
    Esquema: {"status": "HALAL/DUDOSO/HARAM", "reason": "string", "risk_ingredients": [], "confidence": "alta/media/baja", "certification": {"country": "string", "certifier": "string", "reliability": "alta/media/baja"}, "alternatives": []}
  `;

  let text = "";
  try {
    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
            reason: { type: Type.STRING },
            risk_ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidence: { type: Type.STRING },
            certification: {
              type: Type.OBJECT,
              properties: {
                logo: { type: Type.STRING },
                country: { type: Type.STRING },
                certifier: { type: Type.STRING },
                reliability: { type: Type.STRING }
              },
              required: ["country", "certifier", "reliability"]
            },
            alternatives: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["status", "reason", "risk_ingredients", "confidence"]
        }
      }
    });

    text = result.text || "";
    if (!text) throw new Error("Empty response from Gemini");
    
    const res = JSON.parse(text) as AnalysisResult;
    saveToCache(cacheKey, res);
    return res;
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    if (error instanceof SyntaxError) {
      throw new Error(`Error al procesar el análisis: ${error.message}. Respuesta: ${text.substring(0, 50)}`);
    }
    throw error;
  }
}

export async function searchProductByBarcode(barcode: string): Promise<AnalysisResult & { name: string, ingredients: string } | null> {
  const cacheKey = `gemini_barcode_${barcode}`;
  const cached = getFromCache<AnalysisResult & { name: string, ingredients: string }>(cacheKey);
  if (cached) return cached;

  let text = "";
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `Busca el producto con código: ${barcode}. Responde JSON con: name, ingredients, status, reason, risk_ingredients, confidence, alternatives.`;

    const result = await ai.models.generateContent({
      model: GEMINI_SEARCH_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            ingredients: { type: Type.STRING },
            status: { type: Type.STRING },
            reason: { type: Type.STRING },
            risk_ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidence: { type: Type.STRING },
            alternatives: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "ingredients", "status", "reason", "risk_ingredients", "confidence"]
        }
      }
    });

    text = result.text || "";
    console.log("DEBUG: Gemini Barcode Search Response:", text);
    if (!text) throw new Error("No se pudo encontrar información para este código de barras.");
    
    const res = JSON.parse(text);
    saveToCache(cacheKey, res);
    return res;
  } catch (error: any) {
    console.error("Gemini search error:", error);
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("La IA está saturada en este momento debido a muchas peticiones. Por favor, espera 30 segundos e inténtalo de nuevo.");
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Error al procesar la respuesta de la IA: ${error.message}. Respuesta recibida: ${text.substring(0, 100)}...`);
    }
    throw error;
  }
}

export async function searchProductByName(name: string, lang: string = 'es'): Promise<AnalysisResult & { name: string, ingredients: string } | null> {
  const cacheKey = generateCacheKey('gemini_name_search', `${name}_${lang}`);
  const cached = getFromCache<AnalysisResult & { name: string, ingredients: string }>(cacheKey);
  if (cached) return cached;

  let text = "";
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `Busca el producto o categoría: "${name}". Responde JSON con: name, ingredients, status, reason, risk_ingredients, confidence, alternatives. Explicación en ${lang}.`;

    const result = await ai.models.generateContent({
      model: GEMINI_SEARCH_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0.2,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            ingredients: { type: Type.STRING },
            status: { type: Type.STRING },
            reason: { type: Type.STRING },
            risk_ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidence: { type: Type.STRING },
            alternatives: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "ingredients", "status", "reason"]
        }
      }
    });

    text = result.text || "";
    console.log("DEBUG: Gemini Name Search Response:", text);
    if (!text) throw new Error("No se pudo encontrar información para este producto.");
    
    const res = JSON.parse(text);
    saveToCache(cacheKey, res);
    return res;
  } catch (error: any) {
    console.error("Gemini search by name error:", error);
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("La IA está saturada en este momento. Por favor, espera unos segundos e inténtalo de nuevo.");
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Error al procesar la respuesta de la IA: ${error.message}. Respuesta recibida: ${text.substring(0, 100)}...`);
    }
    throw error;
  }
}

export async function explainIngredient(ingredient: string, lang: string = 'es'): Promise<string> {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const languageNames: Record<string, string> = {
      es: 'español', en: 'english', fr: 'français', ar: 'arabic'
    };
    const targetLang = languageNames[lang] || 'español';

    const prompt = `Explica brevemente por qué el ingrediente "${ingredient}" puede ser considerado HARAM o DUDOSO en una dieta halal. Sé específico y profesional. Responde en ${targetLang}.`;

    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ parts: [{ text: prompt }] }]
    });
    
    return result.text || "No se pudo obtener información detallada.";
  } catch (error) {
    console.error("Gemini explain ingredient error:", error);
    return "Error al cargar la información. Por favor, inténtalo de nuevo.";
  }
}

export async function findNearbyPlaces(lat: number, lng: number, query?: string): Promise<any[]> {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = query 
      ? `Encuentra 5 lugares relacionados con "${query}" que sean halal cercanos a latitud ${lat} y longitud ${lng}.`
      : `Encuentra 5 carnicerías, restaurantes o supermercados halal cercanos a latitud ${lat} y longitud ${lng}.`;

    const result = await ai.models.generateContent({
      model: GEMINI_SEARCH_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }] as any,
      }
    });

    const candidates = (result as any).candidates;
    const groundingMetadata = candidates?.[0]?.groundingMetadata;
    const chunks = groundingMetadata?.groundingChunks;

    if (chunks && chunks.length > 0) {
      return chunks.map((chunk: any, index: number) => ({
        id: index,
        name: chunk.web?.title || `Lugar Halal ${index + 1}`,
        address: chunk.web?.uri || "Dirección no disponible",
        rating: 4.5,
        type: query || "Restaurante",
        distance: "Cerca de ti"
      }));
    }
    
    return [];
  } catch (error) {
    console.error("Gemini find nearby places error:", error);
    return [];
  }
}

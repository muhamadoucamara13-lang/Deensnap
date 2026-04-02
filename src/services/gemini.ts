import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_SEARCH_MODEL = "gemini-3.1-pro-preview";

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

export async function analyzeIngredients(ingredients: string, productName: string, lang: string = 'es'): Promise<AnalysisResult> {
  const apiKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : undefined;
  if (!apiKey) {
    throw new Error("Gemini API Key not found. Please ensure it is set in the environment.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const languageNames: Record<string, string> = {
    es: 'español',
    en: 'english',
    fr: 'français',
    ar: 'arabic'
  };

  const targetLang = languageNames[lang] || 'español';

  const prompt = `
    Actúa como experto en certificación halal en Europa.
    Analiza esta lista de ingredientes del producto "${productName}" y responde SOLO en formato JSON.
    
    CRÍTICO: Busca activamente si el producto tiene sellos de certificación oficiales (Halal Food Council, Instituto Halal, etc.).
    Si los ingredientes sugieren que es Halal pero no hay sello, marca como "HALAL" con confianza "media".
    Si hay sello oficial, marca como "HALAL" con confianza "alta".
    
    IMPORTANTE: La explicación en el campo "reason" DEBE estar en ${targetLang}.
    
    País: España
    Ingredientes: ${ingredients}
    
    Esquema de respuesta esperado:
    {
      "status": "HALAL / DUDOSO / HARAM",
      "reason": "explicación clara y breve en ${targetLang}",
      "risk_ingredients": ["lista de ingredientes problemáticos"],
      "confidence": "alta / media / baja",
      "certification": {
        "logo": "URL de un logo oficial si se conoce (opcional)",
        "country": "país del certificador",
        "certifier": "nombre del organismo certificador",
        "reliability": "alta / media / baja"
      },
      "alternatives": ["3 nombres de productos alternativos similares que sean 100% halal"]
    }
  `;

  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout: La IA está tardando demasiado.")), 20000)
    );

    const callPromise = ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
            reason: { type: Type.STRING },
            risk_ingredients: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
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
            alternatives: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["status", "reason", "risk_ingredients", "confidence"]
        }
      }
    });

    const response = await Promise.race([callPromise, timeoutPromise]) as any;

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini analysis error:", error);
    throw error;
  }
}

export async function searchProductByBarcode(barcode: string): Promise<AnalysisResult & { name: string, ingredients: string } | null> {
  const apiKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : undefined;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Busca información detallada en internet sobre el producto con código de barras: ${barcode}.
    Necesito el nombre comercial completo del producto y su lista completa de ingredientes.
    Si encuentras el producto, analiza si es Halal según las normas islámicas (revisando aditivos E, origen de gelatinas, enzimas, origen animal, etc.).
    Si NO encuentras información sobre este código de barras específico, intenta buscar qué producto suele estar asociado a este código en bases de datos globales o describe el tipo de producto si el código sugiere una categoría.
    Responde SOLO en formato JSON.
    
    Esquema:
    {
      "name": "nombre del producto",
      "ingredients": "lista de ingredientes",
      "status": "HALAL / DUDOSO / HARAM",
      "reason": "explicación detallada en español",
      "risk_ingredients": ["ingredientes problemáticos"],
      "confidence": "alta / media / baja",
      "alternatives": ["3 alternativas halal"]
    }
  `;

  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout: La búsqueda está tardando demasiado.")), 45000)
    );

    const callPromise = ai.models.generateContent({
      model: GEMINI_SEARCH_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            ingredients: { type: Type.STRING },
            status: { type: Type.STRING },
            reason: { type: Type.STRING },
            risk_ingredients: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            confidence: { type: Type.STRING },
            alternatives: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["name", "ingredients", "status", "reason", "risk_ingredients", "confidence"]
        }
      }
    });

    const response = await Promise.race([callPromise, timeoutPromise]) as any;
    console.log("Gemini barcode search response received");

    const text = response.text;
    if (!text) {
      console.warn("Gemini returned empty text for barcode:", barcode);
      return null;
    }
    
    console.log("Gemini barcode result text:", text);
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("Error parsing Gemini barcode JSON:", parseError);
      return null;
    }
  } catch (error) {
    console.error("Gemini search error:", error);
    return null;
  }
}

export async function searchProductByName(name: string, lang: string = 'es'): Promise<AnalysisResult & { name: string, ingredients: string } | null> {
  const apiKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : undefined;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  
  const languageNames: Record<string, string> = {
    es: 'español',
    en: 'english',
    fr: 'français',
    ar: 'arabic'
  };
  const targetLang = languageNames[lang] || 'español';

  const prompt = `
    Busca información detallada en internet sobre el producto llamado: ${name}.
    Necesito el nombre comercial completo del producto y su lista completa de ingredientes.
    Si no encuentras un producto específico con ese nombre exacto, busca información general sobre los ingredientes típicos de un producto de ese tipo (por ejemplo, si buscan "jamón", analiza los ingredientes comunes del jamón curado o cocido).
    Analiza si es Halal según las normas islámicas (revisando aditivos E, origen de gelatinas, enzimas, origen animal, etc.).
    Responde SOLO en formato JSON.
    
    Esquema:
    {
      "name": "nombre del producto o tipo de producto",
      "ingredients": "lista de ingredientes encontrados o típicos",
      "status": "HALAL / DUDOSO / HARAM",
      "reason": "explicación detallada en ${targetLang}",
      "risk_ingredients": ["ingredientes problemáticos"],
      "confidence": "alta / media / baja",
      "alternatives": ["3 alternativas halal"]
    }
  `;

  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout: La búsqueda está tardando demasiado.")), 45000)
    );

    const callPromise = ai.models.generateContent({
      model: GEMINI_SEARCH_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            ingredients: { type: Type.STRING },
            status: { type: Type.STRING },
            reason: { type: Type.STRING },
            risk_ingredients: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            confidence: { type: Type.STRING },
            alternatives: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["name", "ingredients", "status", "reason", "risk_ingredients", "confidence"]
        }
      }
    });

    const response = await Promise.race([callPromise, timeoutPromise]) as any;
    console.log("Gemini name search response received");

    const text = response.text;
    if (!text) {
      console.warn("Gemini returned empty text for name search:", name);
      return null;
    }
    
    console.log("Gemini name search result text:", text);
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("Error parsing Gemini name search JSON:", parseError);
      return null;
    }
  } catch (error) {
    console.error("Gemini search by name error:", error);
    return null;
  }
}

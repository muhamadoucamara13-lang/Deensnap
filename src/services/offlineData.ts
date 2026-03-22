import { AnalysisResult } from './gemini';

export interface OfflineProduct extends AnalysisResult {
  barcode: string;
  name: string;
  ingredients: string;
}

export const OFFLINE_PRODUCTS: Record<string, OfflineProduct> = {
  "8410010203040": {
    barcode: "8410010203040",
    name: "Leche Entera",
    ingredients: "Leche de vaca",
    status: "HALAL",
    reason: "La leche pura de vaca es 100% Halal.",
    risk_ingredients: [],
    confidence: "alta"
  },
  "5449000000996": {
    barcode: "5449000000996",
    name: "Coca-Cola Original",
    ingredients: "Agua carbonatada, azúcar, colorante: E150d, acidulante: E338, aromas naturales",
    status: "HALAL",
    reason: "Los ingredientes de la Coca-Cola son considerados Halal en la mayoría de las jurisdicciones.",
    risk_ingredients: [],
    confidence: "alta"
  },
  "7622210449283": {
    barcode: "7622210449283",
    name: "Oreo Original",
    ingredients: "Harina de trigo, azúcar, grasa de palma, cacao magro, jarabe de glucosa, gasificantes, sal, emulgentes, aroma",
    status: "HALAL",
    reason: "Las galletas Oreo en Europa son aptas para vegetarianos y no contienen ingredientes haram.",
    risk_ingredients: ["Grasa de palma (Sostenibilidad)"],
    confidence: "alta"
  },
  "8410100000000": {
    barcode: "8410100000000",
    name: "Jamón Serrano",
    ingredients: "Jamón de cerdo, sal, conservadores (E-252, E-250)",
    status: "HARAM",
    reason: "El cerdo es estrictamente prohibido (Haram) en el Islam.",
    risk_ingredients: ["Carne de cerdo"],
    confidence: "alta"
  }
};

export function getOfflineProduct(barcode: string): OfflineProduct | null {
  return OFFLINE_PRODUCTS[barcode] || null;
}

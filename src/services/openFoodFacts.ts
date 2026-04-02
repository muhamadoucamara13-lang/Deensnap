export interface ProductData {
  barcode: string;
  name: string;
  ingredients: string;
  ingredients_list?: any[];
  additives_tags?: string[];
  image_url?: string;
  brands?: string;
  status?: number;
  nutriments?: {
    energy_100g?: number;
    fat_100g?: number;
    saturated_fat_100g?: number;
    carbohydrates_100g?: number;
    sugars_100g?: number;
    proteins_100g?: number;
    salt_100g?: number;
  };
}

export async function fetchProductFromOFF(barcode: string, retries = 2): Promise<ProductData | null> {
  const fetchWithRetry = async (attempt: number): Promise<ProductData | null> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10 second timeout

    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'DeenSnap - Web - 1.0' // Good practice for OFF API
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      clearTimeout(timeoutId);

      if (data.status === 1) {
        const product = data.product;
        return {
          barcode: barcode,
          name: product.product_name || "Producto desconocido",
          ingredients: product.ingredients_text || "",
          ingredients_list: product.ingredients || [],
          additives_tags: product.additives_tags || [],
          image_url: product.image_front_url,
          brands: product.brands,
          status: data.status,
          nutriments: product.nutriments
        };
      }
      
      // Return status 0 if product not found but API call succeeded
      if (data.status === 0) {
        return { barcode, name: "", ingredients: "", status: 0 };
      }
      
      return null;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`OpenFoodFacts fetch failed (attempt ${attempt + 1}), retrying in ${delay}ms...`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(attempt + 1);
      }
      
      console.error("OpenFoodFacts API error after retries:", error);
      return null;
    }
  };

  return fetchWithRetry(0);
}

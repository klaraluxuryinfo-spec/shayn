import { GoogleGenAI, Type } from "@google/genai";
import { ProductInput, SeoOutput } from "../types";

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Changed input to accept an Array of products
export const generateSeoForBatch = async (products: ProductInput[], retryCount = 0): Promise<SeoOutput[]> => {
  const apiKey = process.env.API_KEY || '';
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-2.5-flash"; 
  
  // Create a prompt that handles multiple items
  const prompt = `
    You are an expert SEO specialist. I will provide a list of ${products.length} products. 
    You must generate optimized SEO metadata for EACH product in the list.
    
    Return the results as a JSON ARRAY where the order matches the input list exactly.
    
    Input Product List:
    ${JSON.stringify(products, null, 2)}
    
    Requirements for each item:
    1. Meta Title: 60-70 chars, keyword-rich.
    2. Meta Description: 155-160 chars, compelling.
    3. Image ALT: Descriptive, SEO friendly.
    4. Short SEO Desc: 40-60 words.
    5. Long SEO Desc: 150-200 words, unique.
    6. Primary Keywords: 5-10 relevant keywords with search volume/intent.
    7. Long-Tail Keywords: 5 specific phrases with search volume/intent.
    8. URL Slug: lowercase, hyphenated.
    9. H1 Title: Optimized H1.
    10. Headings (H2/H3): Suggestions.
    11. SEO Score: 0-100.
    12. Improvement Tips: Actionable advice.
    13. Buying Intent Keywords: 3-5 keywords specifically targeting transactional intent (e.g. containing words like buy, price, deal, shop, best).
    14. Buyer Persona: A 1-sentence description of the ideal customer ready to buy this.

    CRITICAL CONSTRAINTS (Do NOT violate):
    - STRICTLY NO YEARS/DATES: Do NOT include the current year (e.g., "2024", "2025") in the Meta Title, Meta Description, or H1.
    - Even if the product name implies a year (e.g. "Summer Collection"), do not add the specific year 2024/2025.
    - Do NOT include specific dates, timestamps, or "Meta Date".
    - Do NOT include prices or "in stock" status as these change frequently.
    - Ensure content is "evergreen" (valid for a long time).
  `;

  // Define the schema for a single item
  const itemSchema = {
    type: Type.OBJECT,
    properties: {
      metaTitle: { type: Type.STRING },
      metaDescription: { type: Type.STRING },
      imageAltText: { type: Type.STRING },
      shortSeoDescription: { type: Type.STRING },
      longSeoDescription: { type: Type.STRING },
      primaryKeywords: { 
        type: Type.ARRAY, 
        items: { 
          type: Type.OBJECT,
          properties: {
            keyword: { type: Type.STRING },
            searchVolume: { type: Type.STRING },
            intent: { type: Type.STRING }
          },
          required: ["keyword", "searchVolume", "intent"]
        } 
      },
      longTailKeywords: { 
        type: Type.ARRAY, 
        items: { 
          type: Type.OBJECT,
          properties: {
            keyword: { type: Type.STRING },
            searchVolume: { type: Type.STRING },
            intent: { type: Type.STRING }
          },
          required: ["keyword", "searchVolume", "intent"]
        } 
      },
      buyingIntentKeywords: { 
        type: Type.ARRAY, 
        items: { 
          type: Type.OBJECT,
          properties: {
            keyword: { type: Type.STRING },
            searchVolume: { type: Type.STRING },
            intent: { type: Type.STRING }
          },
          required: ["keyword", "searchVolume", "intent"]
        } 
      },
      buyerPersona: { type: Type.STRING },
      urlSlug: { type: Type.STRING },
      h1Title: { type: Type.STRING },
      headingsSuggestions: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING } 
      },
      seoScore: { type: Type.INTEGER },
      improvementTips: { type: Type.STRING },
    },
    required: [
      "metaTitle", "metaDescription", "imageAltText", 
      "shortSeoDescription", "longSeoDescription", "primaryKeywords",
      "longTailKeywords", "buyingIntentKeywords", "buyerPersona", 
      "urlSlug", "h1Title", "headingsSuggestions",
      "seoScore", "improvementTips"
    ]
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY, // We now expect an array of objects
          items: itemSchema
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as SeoOutput[];

  } catch (error: any) {
    // 1. Safe serialization of the error
    let jsonErrorString = '';
    try {
        jsonErrorString = JSON.stringify(error);
    } catch {
        jsonErrorString = '';
    }

    // 2. Combine all error text sources into a single lowercase string for checking
    const allErrors = [
        error?.message,
        error?.response?.data?.error?.message,
        error?.error?.message,
        jsonErrorString
    ].filter(Boolean).join(' ').toLowerCase();

    // 3. Robust detection of quota/429
    const isQuotaError = allErrors.includes('429') || 
                         allErrors.includes('quota') || 
                         allErrors.includes('exhausted') ||
                         allErrors.includes('resource_exhausted');

    if (isQuotaError) {
       console.error("Quota Exceeded detected. Stopping immediately.");
       // Throw a specific string constant that App.tsx can recognize easily
       throw new Error("GEMINI_QUOTA_EXCEEDED");
    }

    // 4. Retry logic only for NON-QUOTA errors
    if (retryCount < 1) {
      const delayTime = 3000;
      console.warn(`API Error (non-quota). Retrying batch...`);
      await wait(delayTime);
      return generateSeoForBatch(products, retryCount + 1);
    }

    console.error("Gemini API Batch Error:", error);
    // Return a clean error message
    throw new Error(error?.message || "Unknown Gemini API Error");
  }
};
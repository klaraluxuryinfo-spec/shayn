import { Type } from "@google/genai";

export const downloadN8nTemplate = () => {
  // We mirror the prompt used in geminiService.ts to ensure consistency
  // Note: In n8n, {{ $json }} refers to the input data from the previous node.
  const promptTemplate = `
    You are an expert SEO specialist. I will provide a list of products. 
    You must generate optimized SEO metadata for EACH product in the list.
    
    Return the results as a JSON ARRAY where the order matches the input list exactly.
    
    Input Product List:
    {{ JSON.stringify($json) }}
    
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

  // Define the schema for n8n (same as geminiService.ts)
  const itemSchema = {
    type: Type.ARRAY,
    items: {
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
    }
  };

  const n8nWorkflow = {
    "name": "AutoSEO Gen - Gemini Flash 2.5",
    "nodes": [
      {
        "parameters": {},
        "id": "e981250d-start-node",
        "name": "When clicking \"Execute Workflow\"",
        "type": "n8n-nodes-base.manualTrigger",
        "typeVersion": 1,
        "position": [
          460,
          340
        ]
      },
      {
        "parameters": {
          "values": {
            "string": [
              {
                "name": "Product Name",
                "value": "Professional Wireless Gaming Mouse"
              },
              {
                "name": "Description",
                "value": "High precision 20000 DPI optical sensor, RGB lighting, 7 programmable buttons, 70 hour battery life."
              }
            ]
          },
          "options": {}
        },
        "id": "mock-data-node",
        "name": "Mock Product Data",
        "type": "n8n-nodes-base.set",
        "typeVersion": 2,
        "position": [
          680,
          340
        ]
      },
      {
        "parameters": {
          "method": "POST",
          "url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
          "sendQuery": true,
          "queryParameters": {
            "parameters": [
              {
                "name": "key",
                "value": "YOUR_GEMINI_API_KEY_HERE"
              }
            ]
          },
          "sendBody": true,
          "contentType": "json",
          "bodyParameters": {
            "parameters": [
              {
                "name": "contents",
                "value": `={{ [{"parts":[{"text": ${JSON.stringify(promptTemplate)} }] }] }}`
              },
              {
                "name": "generationConfig",
                "value": `={{ {"response_mime_type": "application/json", "response_schema": ${JSON.stringify(itemSchema)} } }}`
              }
            ]
          },
          "options": {}
        },
        "id": "gemini-api-node",
        "name": "Gemini 2.5 Flash SEO",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.1,
        "position": [
          900,
          340
        ]
      }
    ],
    "connections": {
      "When clicking \"Execute Workflow\"": {
        "main": [
          [
            {
              "node": "Mock Product Data",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Mock Product Data": {
        "main": [
          [
            {
              "node": "Gemini 2.5 Flash SEO",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
    }
  };

  const blob = new Blob([JSON.stringify(n8nWorkflow, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'autoseo-gemini-n8n-workflow.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
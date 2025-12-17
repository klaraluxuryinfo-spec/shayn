import * as XLSX from 'xlsx';
import { ProductInput, ProcessedRow } from '../types';

export const readExcelFile = (file: File): Promise<ProductInput[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<ProductInput>(sheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const exportToExcel = (data: ProcessedRow[], filename: string = 'seo_generated_output.xlsx') => {
  // flatten arrays for excel cells
  const cleanData = data.map(row => {
    const { status, errorMessage, ...rest } = row; // Remove internal app state
    return {
      ...rest,
      primaryKeywords: Array.isArray(rest.primaryKeywords) 
        ? rest.primaryKeywords.map(k => `${k.keyword} [${k.searchVolume}, ${k.intent}]`).join(', ') 
        : rest.primaryKeywords,
      longTailKeywords: Array.isArray(rest.longTailKeywords) 
        ? rest.longTailKeywords.map(k => `${k.keyword} [${k.searchVolume}, ${k.intent}]`).join(', ') 
        : rest.longTailKeywords,
      buyingIntentKeywords: Array.isArray(rest.buyingIntentKeywords) 
        ? rest.buyingIntentKeywords.map(k => `${k.keyword} [${k.searchVolume}, ${k.intent}]`).join(', ') 
        : rest.buyingIntentKeywords,
      headingsSuggestions: Array.isArray(rest.headingsSuggestions) 
        ? rest.headingsSuggestions.join(' | ') 
        : rest.headingsSuggestions,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(cleanData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'SEO Data');
  XLSX.writeFile(workbook, filename);
};

export const exportToShopifyCSV = (data: ProcessedRow[]) => {
  // Map data to Shopify's specific CSV headers
  const shopifyData = data.map(row => {
    // Attempt to use existing handle if present, otherwise use the generated urlSlug, otherwise generate one from name
    const handle = row['Handle'] || row.urlSlug || row['Product Name']?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    
    // Combine primary and buying intent keywords for tags
    const primaryTags = Array.isArray(row.primaryKeywords) ? row.primaryKeywords.map(k => k.keyword) : [];
    const buyingTags = Array.isArray(row.buyingIntentKeywords) ? row.buyingIntentKeywords.map(k => k.keyword) : [];
    const allTags = [...primaryTags, ...buyingTags].join(', ');

    return {
      'Handle': handle,
      'Title': row['Product Name'],
      'Body (HTML)': row['Description'], // Keeps original description
      'SEO Title': row.metaTitle,
      'SEO Description': row.metaDescription,
      'Tags': allTags,
      'Image Alt Text': row.imageAltText
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(shopifyData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
  // Export as CSV which is required for Shopify
  XLSX.writeFile(workbook, 'shopify_seo_update.csv', { bookType: 'csv' });
};
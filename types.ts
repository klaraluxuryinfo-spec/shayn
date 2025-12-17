export interface ProductInput {
  [key: string]: any;
  "Product Name"?: string;
  Description?: string;
  Category?: string;
  Brand?: string;
  Features?: string;
  "Image File Name"?: string;
}

export interface KeywordData {
  keyword: string;
  searchVolume: string;
  intent: string;
}

export interface SeoOutput {
  metaTitle: string;
  metaDescription: string;
  imageAltText: string;
  shortSeoDescription: string;
  longSeoDescription: string;
  primaryKeywords: KeywordData[];
  longTailKeywords: KeywordData[];
  buyingIntentKeywords: KeywordData[];
  buyerPersona: string;
  urlSlug: string;
  h1Title: string;
  headingsSuggestions: string[];
  seoScore: number;
  improvementTips: string;
}

export interface ProcessedRow extends ProductInput, SeoOutput {
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
}

export enum ProcessingState {
  IDLE,
  PROCESSING,
  COMPLETED,
  ERROR
}
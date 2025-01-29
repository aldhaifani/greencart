// types.ts
export interface Product {
  id: string;
  title: string;
  description: string;
  conciseTitle?: string;
  conciseDescription?: string;
  details: Record<string, string>;
  about: string[];
  link: string;
  timestamp: number;
  co2Footprint: number;
  co2CalculationModel?: string;
  weight?: string;
  material?: string;
}

// types.ts
export interface Product {
  id: string;
  title: string;
  description: string;
  details: Record<string, string>;
  about: string[];
  link: string;
  timestamp: number;
  co2Footprint: number;
  weight?: string;
  material?: string;
}

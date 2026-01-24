"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/generate-types.ts
const fs_1 = require("fs");
const path_1 = require("path");
const types = `
// Auto-generated types for the Espresso ML API

export interface Bean {
  id: string;
  name: string;
  roaster: string;
  country?: string | null;
  region?: string | null;
  farm?: string | null;
  varietal?: string | null;
  processing_method?: string | null;
  altitude_m?: number | null;
  density_category?: string | null;
  created_at: string;
  beanBatches?: BeanBatch[];
}

export interface BeanBatch {
  id: string;
  bean: Bean | string;
  roast_date: string;
  best_by_date?: string | null;
  weight_kg?: number | null;
  notes?: string | null;
  created_at: string;
}

export interface Machine {
  id: string;
  model: string;
  firmware_version?: string | null;
  created_at: string;
  shots?: Shot[];
}

export interface Grinder {
  id: string;
  model: string;
  burr_type?: string | null;
  burr_install_date?: string | null;
  created_at: string;
  shots?: Shot[];
}

export interface Shot {
  id: string;
  grinder: Grinder | string;
  machine: Machine | string;
  bean_batch: BeanBatch | string;
  preparation: ShotPreparation | string;
  extraction: ShotExtraction | string;
  notes?: string | null;
  created_at: string;
}

export interface ShotPreparation {
  id: string;
  dose_g?: number | null;
  grind_setting?: number | null;
  temperature_c?: number | null;
  notes?: string | null;
  created_at: string;
}

export interface ShotExtraction {
  id: string;
  yield_ml?: number | null;
  time_seconds?: number | null;
  pressure_bars?: number | null;
  notes?: string | null;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
`;
const outputPath = (0, path_1.join)(__dirname, '../frontend/src/types/api.types.ts');
(0, fs_1.writeFileSync)(outputPath, types.trim() + '\n', 'utf8');
console.log('TypeScript types generated successfully!');

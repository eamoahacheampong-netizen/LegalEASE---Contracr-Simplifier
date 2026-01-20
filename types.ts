export enum TranslationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface SimplificationResponse {
  original: string;
  simplified: string;
  keyPoints: string[];
}

export interface AppError {
  message: string;
  code?: string;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}